import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  PlusCircle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import Button from './ui/Button'
import Badge from './ui/Badge'
import Card from './ui/Card'
import ProgressBar from './ui/ProgressBar'
import Spinner from './ui/Spinner'

/**
 * GuidedQuestion — one-question-at-a-time guided mode.
 * Props:
 *   checklist:   ChecklistItem[]            full list (may include added follow-ups)
 *   currentIndex: number                    0-based index of current question
 *   answers:     Record<string, Answer>     recorded answers keyed by question id
 *   onAnswer(questionId, text, status)      save answer and advance
 *   onCouldNotCheck(questionId)             mark could-not-check and advance
 *   onBack()                                go to previous question
 *   onBackToChecklist()                     return to checklist view
 *   onFinish()                              proceed to summary
 *   onAddFollowUp(followUp)                 add a suggested follow-up to the checklist
 *   followUp:    FollowUpSuggestion|null    suggestion returned after last answer
 *   loading:     boolean                    answer save in-flight
 *   error:       string|null
 *   onRetry()                               retry after error
 */
export default function GuidedQuestion({
  checklist = [],
  currentIndex = 0,
  answers = {},
  onAnswer,
  onCouldNotCheck,
  onBack,
  onBackToChecklist,
  onFinish,
  onAddFollowUp,
  followUp = null,
  loading = false,
  error = null,
  onRetry,
}) {
  const [answerText, setAnswerText] = useState('')
  const textareaRef = useRef(null)

  const total    = checklist.length
  const question = checklist[currentIndex]
  const isLast   = currentIndex === total - 1

  // Derive the saved answer for the current question
  const savedAnswer = useMemo(
    () => answers[question?.id],
    [answers, question?.id], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Restore any previously recorded answer when navigating to a different question
  const prevIndexRef = useRef(null)
  useEffect(() => {
    if (prevIndexRef.current === currentIndex) return
    prevIndexRef.current = currentIndex
    const saved = answers[question?.id]
    setAnswerText(saved?.status === 'answered' ? saved.text : '')
  }) // intentionally runs every render but bails early via ref guard
  useEffect(() => {
    textareaRef.current?.focus()
  }, [currentIndex])

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[var(--color-muted)] mb-4">No questions to display.</p>
          <Button variant="secondary" onClick={onBackToChecklist} icon={ArrowLeft}>
            Back to checklist
          </Button>
        </div>
      </div>
    )
  }

  function handleSave(e) {
    e?.preventDefault()
    const trimmed = answerText.trim()
    if (!trimmed || loading) return
    onAnswer(question.id, trimmed, 'answered')
  }

  function handleCouldNotCheck() {
    if (loading) return
    onCouldNotCheck(question.id)
    setAnswerText('')
  }

  const canSave   = answerText.trim().length > 0 && !loading
  const answered  = answers[question.id]
  const hasRecord = !!answered

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="px-6 py-4 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onBackToChecklist}
            className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
            aria-label="Back to checklist"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Checklist</span>
          </button>

          <ProgressBar current={currentIndex + 1} total={total} className="flex-1 max-w-xs" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onFinish}
            aria-label="Go to summary"
          >
            Summary
          </Button>
        </div>
      </header>

      {/* ── Question card ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-xl space-y-5">
          {/* Priority badge */}
          <div className="flex items-center gap-2">
            <Badge variant={question.priority === 'Essential' ? 'essential' : 'optional'}>
              {question.priority}
            </Badge>
            <span className="text-xs text-[var(--color-muted)]">
              Question {currentIndex + 1} of {total}
            </span>
          </div>

          {/* The question */}
          <Card>
            <h1 className="text-lg font-semibold text-[var(--color-text)] leading-snug mb-4">
              {question.question}
            </h1>
            <div className="border-t border-[var(--color-border)] pt-4">
              <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-1.5">
                Why this matters
              </p>
              <p className="text-sm text-[var(--color-sand-600)] leading-relaxed">
                {question.why}
              </p>
            </div>
          </Card>

          {/* Already answered banner */}
          {hasRecord && (
            <div
              className={[
                'rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5',
                answered.status === 'answered'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800',
              ].join(' ')}
              role="status"
            >
              {answered.status === 'answered' ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              )}
              <div>
                <span className="font-medium">
                  {answered.status === 'answered' ? 'Recorded: ' : 'Marked as could not check'}
                </span>
                {answered.status === 'answered' && (
                  <span className="ml-1">{answered.text}</span>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium">Something went wrong</p>
                <p className="text-xs mt-0.5 text-red-600">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onRetry} icon={RotateCcw}>
                Retry
              </Button>
            </div>
          )}

          {/* Answer form */}
          <form onSubmit={handleSave} noValidate>
            <label
              htmlFor="answer-input"
              className="block text-sm font-medium text-[var(--color-text)] mb-2"
            >
              Your answer{hasRecord ? ' (update)' : ''}
            </label>
            <textarea
              id="answer-input"
              ref={textareaRef}
              rows={3}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Record what you found out…"
              disabled={loading}
              className={[
                'w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm',
                'text-[var(--color-text)] placeholder-[var(--color-sand-400)]',
                'shadow-sm transition-fast',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]',
                'border-[var(--color-border)] hover:border-[var(--color-sand-300)]',
                loading ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave(e)
              }}
              aria-label="Your answer"
            />

            {/* Action row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
              {/* Left: back */}
              <Button
                variant="secondary"
                size="sm"
                onClick={onBack}
                disabled={currentIndex === 0 || loading}
                icon={ArrowLeft}
                aria-label="Previous question"
              >
                Previous
              </Button>

              {/* Right: could-not-check + save */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCouldNotCheck}
                  disabled={loading}
                  icon={XCircle}
                  aria-label="Mark as could not check"
                >
                  <span className="hidden sm:inline">Couldn't check</span>
                  <span className="sm:hidden">Skip</span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!canSave}
                  icon={loading ? Spinner : isLast ? CheckCircle2 : ArrowRight}
                  iconPosition="right"
                  aria-label={isLast ? 'Save and finish' : 'Save and continue'}
                >
                  {loading ? 'Saving…' : isLast ? 'Save & finish' : 'Save & continue'}
                </Button>
              </div>
            </div>
          </form>

          {/* Follow-up suggestion */}
          {followUp && (
            <FollowUpCard followUp={followUp} onAdd={onAddFollowUp} />
          )}
        </div>
      </main>
    </div>
  )
}

// ── Follow-up suggestion card ─────────────────────────────────────────────────

function FollowUpCard({ followUp, onAdd }) {
  const [dismissed, setDismissed] = useState(false)
  const [added, setAdded]         = useState(false)

  if (dismissed) return null

  function handleAdd() {
    setAdded(true)
    onAdd(followUp)
    setTimeout(() => setDismissed(true), 1000)
  }

  return (
    <div
      className="rounded-xl border border-[var(--color-violet-200)] bg-[var(--color-violet-50)] px-4 py-4"
      role="complementary"
      aria-label="Suggested follow-up question"
    >
      <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">
        Suggested follow-up
      </p>
      <p className="text-sm text-[var(--color-text)] leading-snug mb-1.5">
        "{followUp.question}"
      </p>
      <p className="text-xs text-[var(--color-sand-600)] mb-3">{followUp.why}</p>
      <div className="flex gap-2">
        {!added ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              icon={PlusCircle}
              aria-label="Add this follow-up question to my checklist"
            >
              Add to checklist
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss follow-up suggestion"
            >
              Dismiss
            </Button>
          </>
        ) : (
          <span className="text-sm text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 size={14} aria-hidden="true" /> Added
          </span>
        )}
      </div>
    </div>
  )
}
