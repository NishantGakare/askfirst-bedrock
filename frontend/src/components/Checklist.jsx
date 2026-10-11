import { useState } from 'react'
import { ChevronDown, ChevronUp, Play, ArrowLeft, HelpCircle } from 'lucide-react'
import Button from './ui/Button'
import Badge from './ui/Badge'
import Card from './ui/Card'

/**
 * Checklist — shows the prioritised question list.
 * Props:
 *   situation: string
 *   checklist: ChecklistItem[]
 *   onGuide()           → void   enter guided mode
 *   onBack()            → void   return to situation input
 */
export default function Checklist({ situation, checklist = [], onGuide, onBack }) {
  const [expanded, setExpanded] = useState(new Set())

  const essential = checklist.filter((q) => q.priority === 'Essential')
  const optional  = checklist.filter((q) => q.priority === 'Optional')

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (checklist.length === 0) {
    return (
      <EmptyState onBack={onBack} />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="px-6 py-4 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
            aria-label="Back to situation input"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back
          </button>
          <span className="text-sm font-medium text-[var(--color-text)]">Your checklist</span>
          <span className="text-xs text-[var(--color-muted)]">{checklist.length} questions</span>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Situation recap */}
          <div>
            <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-1">
              Getting ready for
            </p>
            <p className="text-[var(--color-text)] font-medium text-base leading-snug line-clamp-2">
              {situation}
            </p>
          </div>

          {/* Essential questions */}
          <section aria-label="Essential questions">
            <SectionHeading label="Essential" count={essential.length} />
            <ol className="mt-3 space-y-2" aria-label="Essential questions list">
              {essential.map((q, i) => (
                <QuestionRow
                  key={q.id}
                  item={q}
                  index={i + 1}
                  expanded={expanded.has(q.id)}
                  onToggle={() => toggle(q.id)}
                />
              ))}
            </ol>
          </section>

          {/* Optional questions */}
          {optional.length > 0 && (
            <section aria-label="Optional questions">
              <SectionHeading label="Optional" count={optional.length} />
              <ol className="mt-3 space-y-2" aria-label="Optional questions list">
                {optional.map((q, i) => (
                  <QuestionRow
                    key={q.id}
                    item={q}
                    index={essential.length + i + 1}
                    expanded={expanded.has(q.id)}
                    onToggle={() => toggle(q.id)}
                  />
                ))}
              </ol>
            </section>
          )}

          {/* CTA */}
          <div className="pt-2 pb-8">
            <Card className="text-center py-8">
              <HelpCircle
                size={32}
                className="mx-auto mb-3 text-[var(--color-accent)]"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                Ready to work through these?
              </h2>
              <p className="text-sm text-[var(--color-muted)] mb-5 max-w-xs mx-auto">
                Guided mode takes you through one question at a time and helps you record what
                you find out.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={onGuide}
                icon={Play}
                aria-label="Start guided mode"
              >
                Guide me
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ label, count }) {
  return (
    <div className="flex items-center gap-3">
      <Badge variant={label === 'Essential' ? 'essential' : 'optional'}>{label}</Badge>
      <span className="text-xs text-[var(--color-muted)]">{count} question{count !== 1 ? 's' : ''}</span>
      <div className="flex-1 h-px bg-[var(--color-border)]" aria-hidden="true" />
    </div>
  )
}

function QuestionRow({ item, index, expanded, onToggle }) {
  const panelId = `why-${item.id}`
  const btnId   = `btn-${item.id}`

  return (
    <li className="list-none">
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden transition-fast hover:border-[var(--color-sand-300)] hover:shadow-sm">
        {/* Header row */}
        <div className="flex items-start gap-3 px-4 py-3.5">
          <span
            className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-sand-100)] text-[var(--color-sand-600)] text-xs font-semibold flex items-center justify-center"
            aria-hidden="true"
          >
            {index}
          </span>
          <p className="flex-1 text-sm text-[var(--color-text)] leading-snug pt-0.5">
            {item.question}
          </p>
          <button
            id={btnId}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={onToggle}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded px-1 py-0.5 ml-1"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Why</span>
              </>
            )}
          </button>
        </div>

        {/* Expandable "why" panel */}
        {expanded && (
          <div
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            className="px-4 pb-3.5 pt-0 border-t border-[var(--color-border)] bg-[var(--color-sand-50)]"
          >
            <p className="text-xs text-[var(--color-sand-600)] leading-relaxed mt-2.5">
              <span className="font-semibold text-[var(--color-sand-700)]">Why this matters · </span>
              {item.why}
            </p>
          </div>
        )}
      </div>
    </li>
  )
}

function EmptyState({ onBack }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4" aria-hidden="true">🤔</p>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">No checklist yet</h2>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Go back and describe your situation to generate questions.
        </p>
        <Button variant="secondary" onClick={onBack} icon={ArrowLeft}>
          Back to start
        </Button>
      </div>
    </div>
  )
}
