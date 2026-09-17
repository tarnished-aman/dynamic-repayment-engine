interface DashboardHeaderProps {
  borrowerName: string
  borrowerId: string
  category: string
  lastUpdated: string
}

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function DashboardHeader({ borrowerName, borrowerId, category, lastUpdated }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/8 bg-[#0a0a0c]/80 px-6 py-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">{borrowerName}</h1>
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {borrowerId} · {formatCategory(category)} · Updated {lastUpdated}
          </span>
        </div>
      </div>
    </header>
  )
}