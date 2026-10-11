import { CheckCircle2, XCircle, Circle, Download, RotateCcw, ArrowLeft } from 'lucide-react'
import Button from './ui/Button'
import Badge from './ui/Badge'
import Card from './ui/Card'

/**
 * Summary — final view showing recorded answers and unresolved questions.
 * Props:
 *   situation:  string
 *   checklist:  ChecklistItem[]
 *   answers:    Record<string, Answer>
 *   onRestart() → void   start over
 *   onBackToChecklist() → void
 */
export default function Summary({ situation, checklist = [], answers = {}, onRestart, onBackToChecklist }) {
  const answeredItems     = checklist.filter((q) => answers[q.id]?.status === 'answered')
  const couldNotCheckItems = checklist.filter((q) => answers[q.id]?.status === 'could-not-check')
  const unansweredItems   = checklist.filter((q) => !answers[q.id])

  function handleDownload() {
    const lines = [
      'AskFirst — Session Summary',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Situation: ${situation}`,
      '',
      '─── Recorded answers ───────────────────────────────────',
    ]

    if (answeredItems.length === 0) {
      lines.push('  (none recorded)')
    } else {
      answeredItems.forEach((q, i) => {
        lines.push(`\n${i + 1}. ${q.question}`)
        lines.push(`   Answer: ${answers[q.id].text}`)
      })
    }

    lines.push('\n─── Could not check ─────────────────────────────────────')
    if (couldNotCheckItems.length === 0) {
      lines.push('  (none)')
    } else {
      couldNotCheckItems.forEach((q, i) => {
        lines.push(`${i + 1}. ${q.question}`)
        lines.push(`   Status: unknown — could not verify`)
      })
    }

    lines.push('\n─── Still unanswered ────────────────────────────────────')
    if (unansweredItems.length === 0) {
      lines.push('  (none — all questions addressed)')
    } else {
      unansweredItems.forEach((q, i) => {
        lines.push(`${i + 1}. ${q.question}`)
      })
    }

    lines.push('\n─────────────────────────────────────────────────────────')
    lines.push('Based on the answers you entered. Unknown conditions remain unverified.')
    lines.push('AskFirst · know what to ask, know why it matters')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'askfirst-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="px-6 py-4 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToChecklist}
            className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
            aria-label="Back to checklist"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Checklist</span>
          </button>
          <span className="text-sm font-medium text-[var(--color-text)]">Summary</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            icon={Download}
            aria-label="Download summary as text file"
          >
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Situation */}
          <div>
            <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-1">
              Getting ready for
            </p>
            <p className="text-[var(--color-text)] font-medium text-base leading-snug">
              {situation}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3" role="list" aria-label="Summary statistics">
            <StatCard
              value={answeredItems.length}
              label="Recorded"
              color="text-emerald-700"
              bg="bg-emerald-50"
              border="border-emerald-200"
            />
            <StatCard
              value={couldNotCheckItems.length}
              label="Couldn't check"
              color="text-amber-700"
              bg="bg-amber-50"
              border="border-amber-200"
            />
            <StatCard
              value={unansweredItems.length}
              label="Unanswered"
              color="text-[var(--color-sand-600)]"
              bg="bg-[var(--color-sand-100)]"
              border="border-[var(--color-border)]"
            />
          </div>

          {/* Recorded answers */}
          {answeredItems.length > 0 && (
            <Section
              title="Based on the answers you entered"
              icon={<CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />}
            >
              <ol className="space-y-3">
                {answeredItems.map((q, i) => (
                  <li key={q.id} className="flex gap-3">
                    <span
                      className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)] leading-snug">
                        {q.question}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-sand-600)]">
                        {answers[q.id].text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Could not check */}
          {couldNotCheckItems.length > 0 && (
            <Section
              title="Could not verify — status unknown"
              icon={<XCircle size={16} className="text-amber-600" aria-hidden="true" />}
            >
              <ul className="space-y-2">
                {couldNotCheckItems.map((q) => (
                  <li key={q.id} className="flex gap-3 items-start">
                    <XCircle
                      size={15}
                      className="mt-0.5 flex-shrink-0 text-amber-500"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--color-text)] leading-snug">{q.question}</p>
                      <Badge variant="unknown" className="mt-1">Unknown</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Still unanswered */}
          {unansweredItems.length > 0 && (
            <Section
              title="Worth clarifying before you decide"
              icon={<Circle size={16} className="text-[var(--color-sand-400)]" aria-hidden="true" />}
            >
              <ul className="space-y-2">
                {unansweredItems.map((q) => (
                  <li key={q.id} className="flex gap-3 items-start">
                    <Circle
                      size={15}
                      className="mt-0.5 flex-shrink-0 text-[var(--color-sand-400)]"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-[var(--color-text)] leading-snug">{q.question}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Disclaimer + actions */}
          <Card className="text-center py-6">
            <p className="text-xs text-[var(--color-muted)] mb-5 max-w-sm mx-auto">
              This summary reflects the answers you entered. Unknown conditions remain unverified.
              Download a copy to keep.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={handleDownload}
                icon={Download}
                aria-label="Download summary as a text file"
              >
                Download summary
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onRestart}
                icon={RotateCcw}
                aria-label="Start a new situation"
              >
                Start over
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ value, label, color, bg, border }) {
  return (
    <div
      role="listitem"
      className={`rounded-xl border ${border} ${bg} px-4 py-4 text-center`}
    >
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[var(--color-muted)] mt-0.5">{label}</p>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-sand-50)]">
        {icon}
        <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </Card>
  )
}
