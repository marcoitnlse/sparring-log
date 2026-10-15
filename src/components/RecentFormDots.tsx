import type { BoutOutcome } from '../lib/boutStats'

const COLOR: Record<BoutOutcome, string> = {
  win: 'bg-emerald-500 dark:bg-emerald-400',
  loss: 'bg-red-500 dark:bg-red-400',
}

const LABEL: Record<BoutOutcome, string> = {
  win: 'Win',
  loss: 'Loss',
}

export function RecentFormDots({ outcomes }: { outcomes: BoutOutcome[] }) {
  if (outcomes.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No bouts yet</p>
  }

  return (
    <div className="flex gap-2">
      {outcomes.map((outcome, i) => (
        <span key={i} title={LABEL[outcome]} className={`h-3.5 w-3.5 rounded-full ${COLOR[outcome]}`} />
      ))}
    </div>
  )
}
