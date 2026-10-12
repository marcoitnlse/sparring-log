interface ScoreStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
}

export function ScoreStepper({ label, value, onChange }: ScoreStepperProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label} score`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-700 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:active:bg-slate-700"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 rounded-lg border border-slate-300 py-2 text-center text-3xl font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
        />
        <button
          type="button"
          aria-label={`Increase ${label} score`}
          onClick={() => onChange(value + 1)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-700 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:active:bg-slate-700"
        >
          +
        </button>
      </div>
    </div>
  )
}
