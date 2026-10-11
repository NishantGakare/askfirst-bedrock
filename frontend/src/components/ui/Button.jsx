/**
 * Button — primary, secondary, ghost, and danger variants.
 * Fully keyboard-accessible; respects reduced-motion via CSS.
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  'aria-label': ariaLabel,
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-btn)] ' +
    'transition-base focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ' +
    'focus-visible:ring-offset-2 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:scale-[0.98] shadow-sm',
    secondary:
      'bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-sand-100)] active:scale-[0.98]',
    ghost:
      'bg-transparent text-[var(--color-accent)] hover:bg-[var(--color-violet-50)] active:scale-[0.98]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-sm',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[base, variants[variant], sizes[size], fullWidth ? 'w-full' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" />}
    </button>
  )
}
