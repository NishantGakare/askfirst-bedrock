/** Inline loading spinner used during API calls. */
export default function Spinner({ size = 20, label = 'Loading…' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="animate-spin text-[var(--color-accent)]"
      >
        <circle
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
