/**
 * ProgressBar — stepped progress indicator for guided mode.
 * Accessible via aria-valuenow / aria-valuemax.
 */
export default function ProgressBar({ current, total, className = '' }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className={['flex items-center gap-3', className].join(' ')}>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Question ${current} of ${total}`}
        className="flex-1 h-1.5 bg-[var(--color-sand-200)] rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-base"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[var(--color-muted)] tabular-nums whitespace-nowrap">
        {current} / {total}
      </span>
    </div>
  )
}
