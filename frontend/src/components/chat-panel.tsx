import type React from "react"
import { useState, useEffect } from "react"

type Message = {
  id: number
  role: "user" | "bot"
  text: string
  time: string
}

interface ChatResponse {
  borrower_id: string
  intent: "emergency" | "no_emergency"
  extracted_reason: string
  intent_confidence: number
  cashflow_assessment: { hardship_classification: string; confidence: number }
  matched_seasonal_flag: boolean
  seasonal_match_type: "current" | "upcoming" | "none"
  matched_flag: string | null
  matched_flag_month: string | null
  action_taken: "auto_relief" | "escalated" | "none"
  decision_explanation: string[]
  payment_plan_updated: boolean
  conversation_id: string
}

interface ChatHistoryItem {
  conversation_id: string
  timestamp: string
  message: string
  intent: string
  extracted_reason: string
  action_taken: string
  seasonal_match_type: string
}

interface ChatPanelProps {
  borrowerId: string
  language: string
  onActionTaken?: (response: ChatResponse) => void
}

const BASE_URL = "http://localhost:8000"

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

const ACTION_LABEL: Record<string, string> = {
  auto_relief: "Auto relief applied",
  escalated: "Escalated to loan officer",
  none: "No action needed",
}

export function ChatPanel({ borrowerId, language, onActionTaken }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      try {
        const res = await fetch(`${BASE_URL}/chat/history/${borrowerId}`)
        if (!res.ok) return
        const data: { borrower_id: string; conversations: ChatHistoryItem[] } = await res.json()
        if (cancelled) return
        const historyMessages: Message[] = data.conversations.flatMap((c, i) => [
          { id: i * 2 + 1, role: "user" as const, text: c.message, time: formatTime(c.timestamp) },
          {
            id: i * 2 + 2,
            role: "bot" as const,
            text: `${ACTION_LABEL[c.action_taken] ?? c.action_taken} — ${c.extracted_reason}`,
            time: formatTime(c.timestamp),
          },
        ])
        setMessages(historyMessages)
      } catch {
        // no history yet, or borrower not found — start with an empty chat
      }
    }
    loadHistory()
    return () => {
      cancelled = true
    }
  }, [borrowerId])

  async function send() {
    const text = input.trim()
    if (!text || sending) return

    const userMessage: Message = { id: Date.now(), role: "user", text, time: nowTime() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSending(true)

    try {
      const res = await fetch(`${BASE_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrower_id: borrowerId, message: text, language, input_type: "text" }),
      })
      const data: ChatResponse = await res.json()

      const botMessage: Message = {
        id: Date.now() + 1,
        role: "bot",
        text: `${ACTION_LABEL[data.action_taken] ?? data.action_taken} — ${data.extracted_reason}`,
        time: nowTime(),
      }
      setMessages((prev) => [...prev, botMessage])

      if (data.payment_plan_updated) {
        onActionTaken?.(data)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, role: "bot", text: "Something went wrong reaching the assessment service.", time: nowTime() },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      send()
    }
  }

  return (
    <aside className="flex h-screen w-80 shrink-0 flex-col border-r border-white/8 bg-[#0d0d10]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-100">Advisor</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/70" />
            Online · Encrypted
          </span>
        </div>
        <button
          onClick={() => setMessages([])}
          className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-100"
        >
          Clear
        </button>
      </header>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-snug ${
                m.role === "user"
                  ? "bg-emerald-500 text-emerald-950 shadow-[0_0_20px] shadow-emerald-500/20"
                  : "border border-white/8 bg-white/[0.03] text-zinc-200"
              }`}
            >
              {m.text}
            </div>
            <span className="mt-1 font-mono text-[10px] text-zinc-600">{m.time}</span>
          </div>
        ))}
        {sending && <span className="font-mono text-[10px] text-zinc-500">Advisor is thinking…</span>}
      </div>

      {/* Input */}
      <div className="flex items-stretch gap-2 border-t border-white/8 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="min-w-0 flex-1 rounded-md border border-white/8 bg-white/[0.03] px-3 text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-400/60"
        />
        <button
          onClick={send}
          disabled={sending}
          className="shrink-0 rounded-md bg-emerald-500 px-4 font-mono text-[11px] uppercase tracking-wider text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </aside>
  )
}
