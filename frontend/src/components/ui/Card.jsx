/**
 * Card — white surface with rounded corners and a subtle shadow.
 * Optional `as` prop for semantic HTML (article, section, div, li).
 */
export default function Card({ children, className = '', as: Tag = 'div', padding = true }) {
  return (
    <Tag
      className={[
        'bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-sm border border-[var(--color-border)]',
        padding ? 'p-6' : '',
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  )
}
