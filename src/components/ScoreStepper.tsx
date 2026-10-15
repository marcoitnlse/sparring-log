interface ScoreStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  /** Scores can't exceed what the bout was fenced to. */
  max?: number
}

export function ScoreStepper({ label, value, onChange, max }: ScoreStepperProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const raw = Math.max(0, Number(e.target.value) || 0)
          onChange(max !== undefined ? Math.min(raw, max) : raw)
        }}
        className="w-20 rounded-lg border border-slate-300 py-3 text-center text-4xl font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
      />
    </div>
  )
}
