interface SegmentedToggleProps<T extends string | number> {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedToggle<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div className="inline-flex rounded-full bg-slate-200 p-1 dark:bg-slate-800">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
