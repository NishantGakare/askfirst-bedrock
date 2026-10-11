/**
 * Badge — small status/priority label pill.
 * Variants: essential, optional, answered, unknown, info.
 */
export default function Badge({ children, variant = 'info', className = '' }) {
  const variants = {
    essential: 'bg-[var(--color-violet-100)] text-[var(--color-violet-700)]',
    optional:  'bg-[var(--color-sand-100)]  text-[var(--color-sand-700)]',
    answered:  'bg-emerald-50 text-emerald-700',
    unknown:   'bg-amber-50   text-amber-700',
    info:      'bg-[var(--color-sand-100)]  text-[var(--color-sand-600)]',
  }

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide',
        variants[variant] ?? variants.info,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
