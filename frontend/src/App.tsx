import { useState } from "react";

type Message = {
  type: "advisor" | "user";
  text: string;
  time: string;
};

type PaymentStatus = "SCHEDULED" | "CLEARED" | "PENDING" | "FAILED";

type Payment = {
  id: string;
  date: string;
  payee: string;
  method: string;
  amount: string;
  status: PaymentStatus;
};

function App() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      type: "advisor",
      text: "Assessment session opened. Your trust score updated to 780 this cycle.",
      time: "09:41",
    },
    {
      type: "user",
      text: "Why did my risk flag #RF-9021 trigger?",
      time: "09:42",
    },
    {
      type: "advisor",
      text: "A recurring outflow exceeded 40% of monthly inflow for 2 consecutive periods. Resolve it to recover +6 pts.",
      time: "09:42",
    },
    {
      type: "user",
      text: "Understood. Schedule a review for next week.",
      time: "09:44",
    },
    {
      type: "advisor",
      text: "Review scheduled for MON 22 SEP. I will notify you 24h prior.",
      time: "09:44",
    },
  ]);

  const payments: Payment[] = [
    {
      id: "TX-4471",
      date: "2026-09-18",
      payee: "Meridian Mortgage",
      method: "ACH",
      amount: "$2,140.00",
      status: "SCHEDULED",
    },
    {
      id: "TX-4468",
      date: "2026-09-15",
      payee: "Volt Auto Finance",
      method: "ACH",
      amount: "$480.25",
      status: "CLEARED",
    },
    {
      id: "TX-4465",
      date: "2026-09-12",
      payee: "Aperture Card",
      method: "WIRE",
      amount: "$1,015.00",
      status: "PENDING",
    },
    {
      id: "TX-4460",
      date: "2026-09-09",
      payee: "Northline Utilities",
      method: "ACH",
      amount: "$212.40",
      status: "CLEARED",
    },
    {
      id: "TX-4457",
      date: "2026-09-05",
      payee: "Sable Insurance",
      method: "CARD",
      amount: "$334.00",
      status: "FAILED",
    },
    {
      id: "TX-4452",
      date: "2026-09-01",
      payee: "Harbor Student Loan",
      method: "ACH",
      amount: "$398.75",
      status: "CLEARED",
    },
    {
      id: "TX-4448",
      date: "2026-08-28",
      payee: "Metro Telecom",
      method: "ACH",
      amount: "$129.99",
      status: "CLEARED",
    },
    {
      id: "TX-4441",
      date: "2026-08-22",
      payee: "Evergreen Credit",
      method: "CARD",
      amount: "$675.00",
      status: "PENDING",
    },
  ];

  const sendMessage = () => {
    if (!message.trim()) return;

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((current) => [
      ...current,
      {
        type: "user",
        text: message.trim(),
        time: now,
      },
    ]);

    setMessage("");
  };

  const getStatusClass = (status: PaymentStatus) => {
    switch (status) {
      case "SCHEDULED":
        return "status-scheduled";
      case "CLEARED":
        return "status-cleared";
      case "PENDING":
        return "status-pending";
      case "FAILED":
        return "status-failed";
    }
  };

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          width: 100%;
          min-height: 100%;
        }

        body {
          background: #090a0c;
          font-family: Arial, Helvetica, sans-serif;
          color: #e7e7e7;
        }

        button,
        input {
          font-family: inherit;
        }

        button {
          cursor: pointer;
        }

        /* =========================
           APP
        ========================= */

        .app {
          width: 100%;
          height: 100vh;
          display: flex;
          overflow: hidden;
          background: #090a0c;
        }

        /* =========================
           SIDEBAR
        ========================= */

        .sidebar {
          width: 320px;
          min-width: 320px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0b0c0e;
          border-right: 1px solid #24262a;
        }

        .sidebar-header {
          height: 76px;
          padding: 13px 16px;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #24262a;
        }

        .advisor-title {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .status {
          margin-top: 6px;
          color: #73767d;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .status-dot {
          color: #00d394;
          margin-right: 5px;
        }

        .header-actions {
          display: flex;
          gap: 14px;
          color: #74777e;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .chat {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .chat::-webkit-scrollbar,
        .main::-webkit-scrollbar {
          width: 7px;
        }

        .chat::-webkit-scrollbar-thumb,
        .main::-webkit-scrollbar-thumb {
          background: #292b30;
          border-radius: 10px;
        }

        .message {
          margin-bottom: 11px;
        }

        .bubble {
          max-width: 245px;
          padding: 11px 12px;
          border-radius: 10px;
          border: 1px solid #292b30;
          font-size: 12px;
          line-height: 1.5;
        }

        .advisor .bubble {
          background: #141518;
          color: #dedfe2;
        }

        .user {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user .bubble {
          background: #00bd80;
          border-color: #00bd80;
          color: #04130e;
        }

        .time {
          margin-top: 5px;
          color: #646870;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .chat-input {
          height: 47px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid #24262a;
        }

        .mic {
          width: 34px;
          height: 30px;
          border: 1px solid #2b2d32;
          border-radius: 7px;
          background: #101114;
          color: #888b92;
        }

        .message-input {
          flex: 1;
          min-width: 0;
          height: 30px;
          padding: 0 10px;
          border: 1px solid #2b2d32;
          border-radius: 7px;
          outline: none;
          background: #121316;
          color: #eee;
          font-size: 11px;
        }

        .message-input::placeholder {
          color: #656870;
        }

        .message-input:focus {
          border-color: #00a975;
        }

        .send {
          height: 30px;
          padding: 0 15px;
          border: none;
          border-radius: 7px;
          background: #00bd80;
          color: #03130e;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .send:hover,
        .assessment-button:hover {
          background: #00d394;
        }

        /* =========================
           MAIN
        ========================= */

        .main {
          flex: 1;
          min-width: 0;
          height: 100vh;
          overflow-y: auto;
          background: #0b0c0e;
        }

        .topbar {
          min-height: 74px;
          padding: 0 32px 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #24262a;
        }

        .title {
          margin-bottom: 7px;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        .subtitle {
          color: #70737a;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .search {
          width: 320px;
          height: 38px;
          padding: 0 13px;
          border: 1px solid #292b30;
          border-radius: 8px;
          outline: none;
          background: #111215;
          color: #ddd;
          font-size: 11px;
        }

        .search::placeholder {
          color: #686b72;
        }

        .search:focus {
          border-color: #3a3d43;
        }

        .dashboard {
          padding: 24px;
        }

        /* =========================
           CARDS
        ========================= */

        .top-cards {
          display: grid;
          grid-template-columns: 1.05fr 1.05fr 1fr;
          gap: 16px;
        }

        .card {
          background: #121316;
          border: 1px solid #292b30;
          border-radius: 14px;
          padding: 20px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 13px;
          border-bottom: 1px solid #292b30;
          color: #767980;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        /* =========================
           TRUST SCORE
        ========================= */

        .score {
          margin-top: 17px;
          display: flex;
          align-items: baseline;
        }

        .score-number {
          color: #00d394;
          font-size: 49px;
          line-height: 1;
          font-weight: 700;
          text-shadow: 0 0 20px rgba(0, 211, 148, 0.18);
        }

        .score-max {
          margin-left: 8px;
          color: #777a81;
          font-size: 17px;
        }

        .score-change {
          margin-top: 8px;
          color: #00d394;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .score-bars {
          display: flex;
          gap: 4px;
          margin: 17px 0;
        }

        .bar {
          flex: 1;
          height: 25px;
          border-radius: 7px;
          background: #00d394;
          box-shadow: 0 0 10px rgba(0, 211, 148, 0.12);
        }

        .bar.empty {
          background: #15171a;
          border: 1px solid #383a40;
          box-shadow: none;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding-top: 13px;
          border-top: 1px solid #292b30;
        }

        .stat {
          padding-right: 12px;
          margin-right: 12px;
          border-right: 1px solid #292b30;
        }

        .stat:last-child {
          border-right: none;
        }

        .stat-label {
          color: #74777f;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .stat-value {
          margin-top: 8px;
          font-size: 13px;
          font-weight: 700;
        }

        /* =========================
           RISK
        ========================= */

        .risk-box {
          margin-top: 17px;
          padding: 14px 12px;
          background: #211f18;
          border-left: 2px solid #ffc400;
          border-radius: 8px;
        }

        .risk-title {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .risk-id {
          color: #ffc400;
          font-size: 9px;
        }

        .risk-text {
          margin-top: 8px;
          color: #aaa;
          font-size: 11px;
          line-height: 1.5;
        }

        .risk-bottom {
          margin-top: 13px;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #39352a;
          color: #888a8e;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .resolve {
          color: #ffc400;
          font-weight: 600;
        }

        .flags {
          margin-top: 14px;
        }

        .flag {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #292b30;
          color: #888b92;
          font-size: 10px;
        }

        /* =========================
           ASSESSMENT
        ========================= */

        .assessment-list {
          margin-top: 7px;
        }

        .assessment-item {
          display: flex;
          justify-content: space-between;
          padding: 13px 0;
          border-bottom: 1px solid #292b30;
          font-size: 11px;
        }

        .complete {
          color: #00d394;
          font-size: 9px;
        }

        .pending {
          color: #ffca05;
          font-size: 9px;
        }

        .queued {
          color: #777a81;
          font-size: 9px;
        }

        .assessment-text {
          margin: 12px 0;
          color: #92959c;
          font-size: 11px;
          line-height: 1.5;
        }

        .assessment-button {
          width: 100%;
          height: 41px;
          border: none;
          border-radius: 8px;
          background: #00bd80;
          color: #04130e;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        /* =========================
           CASH FLOW
        ========================= */

        .chart-card {
          position: relative;
          min-height: 330px;
          margin-top: 16px;
          padding: 20px;
          overflow: hidden;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid #292b30;
          color: #777a81;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .legend {
          display: flex;
          gap: 18px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00d394;
        }

        .legend-dot.out {
          background: transparent;
          border: 1px solid #6a6d74;
        }

        .chart {
          position: relative;
          height: 235px;
          margin-top: 18px;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          background: repeating-linear-gradient(
            to top,
            transparent 0px,
            transparent 43px,
            #22242a 44px,
            transparent 45px
          );
        }

        .y-labels {
          position: absolute;
          left: 0;
          top: -7px;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #555860;
          font-size: 8px;
        }

        .bar-group {
          position: relative;
          height: 100%;
          display: flex;
          align-items: flex-end;
          gap: 7px;
          margin-left: 30px;
        }

        .chart-bar {
          width: 17px;
          border-radius: 6px 6px 0 0;
          background: #00d394;
          box-shadow: 0 0 14px rgba(0, 211, 148, 0.18);
        }

        .chart-bar.outflow {
          background: transparent;
          border: 1px solid #555960;
          box-shadow: none;
        }

        .month {
          position: absolute;
          left: 50%;
          bottom: -18px;
          transform: translateX(-50%);
          color: #555860;
          font-size: 8px;
        }

        /* =========================
           PAYMENT SCHEDULE
        ========================= */

        .payment-card {
          margin-top: 16px;
          padding: 0;
          overflow: hidden;
        }

        .payment-header {
          height: 52px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #292b30;
        }

        .payment-title {
          color: #777a81;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .payment-records {
          color: #555860;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .payment-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .payment-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          text-align: left;
        }

        .payment-table th {
          height: 43px;
          padding: 0 20px;
          border-bottom: 1px solid #292b30;
          color: #777a81;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .payment-table td {
          height: 49px;
          padding: 0 20px;
          border-bottom: 1px solid #24262a;
          color: #d7d8db;
          font-size: 11px;
        }

        .payment-table tbody tr:last-child td {
          border-bottom: none;
        }

        .payment-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.025);
        }

        .payment-id {
          color: #686b72 !important;
          font-family: monospace;
          font-size: 10px !important;
        }

        .payment-date {
          color: #a5a7ad !important;
          font-family: monospace;
          font-size: 10px !important;
        }

        .payment-payee {
          color: #e0e1e3 !important;
        }

        .payment-method {
          color: #85888f !important;
          font-family: monospace;
          font-size: 9px !important;
        }

        .payment-amount {
          color: #e6e7e9 !important;
          text-align: right;
          font-family: monospace;
          font-size: 10px !important;
        }

        .status-cell {
          white-space: nowrap;
        }

        .payment-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: monospace;
          font-size: 9px;
          letter-spacing: 1.1px;
        }

        .status-dot-small {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-scheduled {
          color: #00b8ff;
        }

        .status-scheduled .status-dot-small {
          background: #00b8ff;
          box-shadow: 0 0 7px rgba(0, 184, 255, 0.6);
        }

        .status-cleared {
          color: #00d394;
        }

        .status-cleared .status-dot-small {
          background: #00d394;
          box-shadow: 0 0 7px rgba(0, 211, 148, 0.6);
        }

        .status-pending {
          color: #ffc400;
        }

        .status-pending .status-dot-small {
          background: #ffc400;
          box-shadow: 0 0 7px rgba(255, 196, 0, 0.6);
        }

        .status-failed {
          color: #ff315c;
        }

        .status-failed .status-dot-small {
          background: #ff315c;
          box-shadow: 0 0 7px rgba(255, 49, 92, 0.6);
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 1050px) {
          .sidebar {
            width: 280px;
            min-width: 280px;
          }

          .top-cards {
            grid-template-columns: 1fr 1fr;
          }

          .top-cards .card:last-child {
            grid-column: 1 / -1;
          }

          .search {
            width: 260px;
          }
        }

        @media (max-width: 760px) {
          .sidebar {
            display: none;
          }

          .topbar {
            padding: 15px;
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .search {
            width: 100%;
          }

          .dashboard {
            padding: 15px;
          }

          .top-cards {
            grid-template-columns: 1fr;
          }

          .top-cards .card:last-child {
            grid-column: auto;
          }
        }
      `}</style>

      {/* =========================
          LEFT ADVISOR PANEL
      ========================= */}

      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="advisor-title">Advisor</div>

            <div className="status">
              <span className="status-dot">●</span>
              ONLINE&nbsp;&nbsp; ENCRYPTED
            </div>
          </div>

          <div className="header-actions">
            <span>CLEAR</span>
            <span>EXPORT</span>
          </div>
        </div>

        <div className="chat">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.type === "user" ? "user" : "advisor"
              }`}
            >
              <div className="bubble">{msg.text}</div>
              <div className="time">{msg.time}</div>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <button className="mic" type="button">
            ♩
          </button>

          <input
            className="message-input"
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            className="send"
            type="button"
            onClick={sendMessage}
          >
            SEND
          </button>
        </div>
      </aside>

      {/* =========================
          MAIN DASHBOARD
      ========================= */}

      <main className="main">
        <header className="topbar">
          <div>
            <div className="title">Financial Health Overview</div>

            <div className="subtitle">
              ACCT #98-402-1174&nbsp;&nbsp;·&nbsp;&nbsp;
              UPDATED 09:44&nbsp;&nbsp;·&nbsp;&nbsp; Q3 2026
            </div>
          </div>

          <input
            className="search"
            type="text"
            placeholder="⌕  Search transactions, flags, IDs"
          />
        </header>

        <div className="dashboard">
          <div className="top-cards">

            {/* TRUST SCORE */}

            <section className="card">
              <div className="card-header">
                <span>TRUST SCORE</span>
                <span>RANGE 300–850</span>
              </div>

              <div className="score">
                <span className="score-number">780</span>
                <span className="score-max">/850</span>
              </div>

              <div className="score-change">
                ▲ +14 pts this month
              </div>

              <div className="score-bars">
                {Array.from({ length: 16 }).map((_, index) => (
                  <div
                    key={index}
                    className={`bar ${
                      index === 15 ? "empty" : ""
                    }`}
                  />
                ))}
              </div>

              <div className="stats">
                <div className="stat">
                  <div className="stat-label">TIER</div>
                  <div className="stat-value">A2</div>
                </div>

                <div className="stat">
                  <div className="stat-label">UTILIZATION</div>
                  <div className="stat-value">28%</div>
                </div>

                <div className="stat">
                  <div className="stat-label">PERCENTILE</div>
                  <div className="stat-value">91st</div>
                </div>
              </div>
            </section>

            {/* RISK FLAG */}

            <section className="card">
              <div className="card-header">
                <span>RISK FLAG</span>
                <span className="pending">● 1 ACTIVE</span>
              </div>

              <div className="risk-box">
                <div className="risk-title">
                  <span>High Outflow Ratio</span>
                  <span className="risk-id">#RF-9021</span>
                </div>

                <div className="risk-text">
                  Recurring outflow exceeded 40% of monthly
                  inflow across two consecutive periods.
                </div>

                <div className="risk-bottom">
                  <span>SEVERITY: MODERATE</span>
                  <span className="resolve">RESOLVE →</span>
                </div>
              </div>

              <div className="flags">
                <div className="flag">
                  <span>#RF-8834 · Late payment</span>
                  <span>CLEARED</span>
                </div>

                <div className="flag">
                  <span>#RF-8710 · KYC refresh</span>
                  <span>CLEARED</span>
                </div>
              </div>
            </section>

            {/* ASSESSMENT */}

            <section className="card">
              <div className="card-header">
                <span>ASSESSMENT</span>
                <span>DUE 22 SEP</span>
              </div>

              <div className="assessment-list">
                <div className="assessment-item">
                  <span>Income verification</span>
                  <span className="complete">COMPLETE</span>
                </div>

                <div className="assessment-item">
                  <span>Liability review</span>
                  <span className="pending">PENDING</span>
                </div>

                <div className="assessment-item">
                  <span>Affordability model</span>
                  <span className="queued">QUEUED</span>
                </div>
              </div>

              <div className="assessment-text">
                Complete the remaining checks to finalize your
                Q3 affordability review.
              </div>

              <button
                className="assessment-button"
                type="button"
              >
                START ASSESSMENT
              </button>
            </section>
          </div>

          {/* =========================
              CASH FLOW
          ========================= */}

          <section className="card chart-card">
            <div className="chart-header">
              <span>CASH FLOW · 6 MO</span>

              <div className="legend">
                <div className="legend-item">
                  <span className="legend-dot" />
                  INFLOW
                </div>

                <div className="legend-item">
                  <span className="legend-dot out" />
                  OUTFLOW
                </div>
              </div>
            </div>

            <div className="chart">
              <div className="y-labels">
                <span>80k</span>
                <span>60k</span>
                <span>40k</span>
                <span>20k</span>
                <span>0</span>
              </div>

              <div className="bar-group">
                <div className="chart-bar" style={{ height: "53%" }} />
                <div
                  className="chart-bar outflow"
                  style={{ height: "34%" }}
                />
                <span className="month">APR</span>
              </div>

              <div className="bar-group">
                <div className="chart-bar" style={{ height: "49%" }} />
                <div
                  className="chart-bar outflow"
                  style={{ height: "41%" }}
                />
                <span className="month">MAY</span>
              </div>

              <div className="bar-group">
                <div className="chart-bar" style={{ height: "61%" }} />
                <div
                  className="chart-bar outflow"
                  style={{ height: "27%" }}
                />
                <span className="month">JUN</span>
              </div>

              <div className="bar-group">
                <div className="chart-bar" style={{ height: "56%" }} />
                <div
                  className="chart-bar outflow"
                  style={{ height: "38%" }}
                />
                <span className="month">JUL</span>
              </div>

              <div className="bar-group">
                <div className="chart-bar" style={{ height: "64%" }} />
                <div
                  className="chart-bar outflow"
                  style={{ height: "32%" }}
                />
                <span className="month">AUG</span>
              </div>

              <div className="bar-group">
                <div className="chart-bar" style={{ height: "59%" }} />
                <div
                  className="chart-bar outflow"
                  style={{ height: "45%" }}
                />
                <span className="month">SEP</span>
              </div>
            </div>
          </section>

          {/* =========================
              PAYMENT SCHEDULE
          ========================= */}

          <section className="card payment-card">
            <div className="payment-header">
              <span className="payment-title">
                PAYMENT SCHEDULE
              </span>

              <span className="payment-records">
                8 RECORDS
              </span>
            </div>

            <div className="payment-table-wrapper">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>DATE</th>
                    <th>PAYEE</th>
                    <th>METHOD</th>
                    <th style={{ textAlign: "right" }}>
                      AMOUNT
                    </th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="payment-id">
                        {payment.id}
                      </td>

                      <td className="payment-date">
                        {payment.date}
                      </td>

                      <td className="payment-payee">
                        {payment.payee}
                      </td>

                      <td className="payment-method">
                        {payment.method}
                      </td>

                      <td className="payment-amount">
                        {payment.amount}
                      </td>

                      <td className="status-cell">
                        <span
                          className={`payment-status ${getStatusClass(
                            payment.status
                          )}`}
                        >
                          <span className="status-dot-small" />
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;