import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import Button from './ui/Button'
import Spinner from './ui/Spinner'
import { EXAMPLE_PROMPTS } from '../data/sampleData'

/**
 * SituationInput — opening screen.
 * Props:
 *   onSubmit(situation: string) → void   called when user confirms their situation
 *   loading: boolean                     true while apiPrepare is in-flight
 *   error: string|null                   error message to display
 */
export default function SituationInput({ onSubmit, loading = false, error = null, mode = 'sample' }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
  }

  function fillExample(prompt) {
    setValue(prompt)
  }

  const canSubmit = value.trim().length > 0 && !loading

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--color-accent)]" aria-hidden="true" />
          <span className="font-semibold text-[var(--color-text)] tracking-tight text-lg">
            AskFirst
          </span>
        </div>
        <span className="text-xs text-[var(--color-muted)] hidden sm:block">
          Know what to ask.
        </span>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Headline */}
          <div className="text-center mb-10">
            <h1
              className="text-4xl sm:text-5xl font-serif text-[var(--color-text)] leading-tight mb-3"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              A better question.
              <br />
              <span className="text-[var(--color-accent)]">A clearer next step.</span>
            </h1>
            <p className="text-[var(--color-muted)] text-base sm:text-lg max-w-md mx-auto">
              Describe what you're getting ready for and get a short, prioritised checklist of
              questions to ask.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="relative">
              <label htmlFor="situation-input" className="sr-only">
                Describe your situation
              </label>
              <textarea
                id="situation-input"
                name="situation"
                rows={4}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. I'm about to rent my first flat and want to know what to check before signing…"
                disabled={loading}
                aria-describedby={error ? 'situation-error' : 'situation-hint'}
                className={[
                  'w-full resize-none rounded-xl border bg-white px-4 py-3.5 text-sm',
                  'text-[var(--color-text)] placeholder-[var(--color-sand-400)]',
                  'shadow-sm transition-fast',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]',
                  error
                    ? 'border-red-400'
                    : 'border-[var(--color-border)] hover:border-[var(--color-sand-300)]',
                  loading ? 'opacity-60 cursor-not-allowed' : '',
                ].join(' ')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e)
                }}
              />
              <p id="situation-hint" className="mt-1.5 text-xs text-[var(--color-muted)] pl-1">
                Press Ctrl+Enter to submit · any situation is welcome
              </p>
            </div>

            {/* Error */}
            {error && (
              <p
                id="situation-error"
                role="alert"
                className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
              >
                <span aria-hidden="true">⚠</span> {error}
              </p>
            )}

            {/* Submit */}
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!canSubmit}
                icon={loading ? Spinner : ArrowRight}
                iconPosition="right"
                aria-label="Build my checklist"
              >
                {loading ? 'Building checklist…' : 'Build my checklist'}
              </Button>
            </div>
          </form>

          {/* Example chips */}
          <div className="mt-8">
            <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-widest mb-3">
              Try an example
            </p>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Example situations">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  role="listitem"
                  onClick={() => fillExample(prompt)}
                  disabled={loading}
                  className={[
                    'px-3.5 py-1.5 rounded-full text-sm border transition-fast',
                    'border-[var(--color-border)] bg-white text-[var(--color-sand-700)]',
                    'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-violet-50)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  ].join(' ')}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="px-6 py-4 text-center text-xs text-[var(--color-sand-400)]">
        AskFirst · know what to ask, know why it matters
      </footer>
    </div>
  )
}
