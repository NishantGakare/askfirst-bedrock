import { useState, useCallback } from 'react'
import SituationInput  from './components/SituationInput'
import Checklist       from './components/Checklist'
import GuidedQuestion  from './components/GuidedQuestion'
import Summary         from './components/Summary'
import { apiPrepare, apiAnswer, apiResetSession } from './api'

/**
 * App — top-level screen state machine.
 *
 * Screens:
 *   'input'   → SituationInput
 *   'list'    → Checklist
 *   'guided'  → GuidedQuestion
 *   'summary' → Summary
 *
 * All data lives here; child components are purely presentational.
 */
export default function App() {
  // ── Screen state ──────────────────────────────────────────────
  const [screen, setScreen] = useState('input')

  // ── Domain state ──────────────────────────────────────────────
  const [situation,    setSituation]    = useState('')
  const [checklist,    setChecklist]    = useState([])   // ChecklistItem[]
  const [answers,      setAnswers]      = useState({})   // { [questionId]: { text, status } }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [followUp,     setFollowUp]     = useState(null) // FollowUpSuggestion | null

  // ── Async state ───────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // ── Helpers ───────────────────────────────────────────────────
  function clearError() { setError(null) }

  // ── Handlers ──────────────────────────────────────────────────

  /** SituationInput → Checklist */
  const handleSituationSubmit = useCallback(async (text) => {
    clearError()
    setLoading(true)
    try {
      const { checklist: cl } = await apiPrepare(text)
      setSituation(text)
      setChecklist(cl)
      setAnswers({})
      setCurrentIndex(0)
      setFollowUp(null)
      setScreen('list')
    } catch (err) {
      setError('Could not generate your checklist. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  /** Checklist → GuidedQuestion */
  const handleStartGuided = useCallback(() => {
    setCurrentIndex(0)
    setFollowUp(null)
    clearError()
    setScreen('guided')
  }, [])

  /** GuidedQuestion: save answer and advance */
  const handleAnswer = useCallback(async (questionId, text, status) => {
    clearError()
    setLoading(true)
    try {
      const { followUp: fu } = await apiAnswer(questionId, text, status)
      setAnswers((prev) => ({ ...prev, [questionId]: { text, status } }))
      setFollowUp(fu)

      // Only auto-advance if on the last question we go to summary
      const isLast = currentIndex === checklist.length - 1
      if (isLast) {
        setLoading(false)
        setScreen('summary')
        return
      }
      setCurrentIndex((i) => i + 1)
    } catch (err) {
      setError('Could not save your answer. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentIndex, checklist.length])

  /** GuidedQuestion: mark could-not-check and advance */
  const handleCouldNotCheck = useCallback(async (questionId) => {
    clearError()
    setLoading(true)
    try {
      await apiAnswer(questionId, '', 'could-not-check')
      setAnswers((prev) => ({ ...prev, [questionId]: { text: '', status: 'could-not-check' } }))
      setFollowUp(null)
      const isLast = currentIndex === checklist.length - 1
      if (isLast) {
        setLoading(false)
        setScreen('summary')
        return
      }
      setCurrentIndex((i) => i + 1)
    } catch (err) {
      setError('Could not save. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentIndex, checklist.length])

  /** GuidedQuestion: previous question */
  const handleBack = useCallback(() => {
    setFollowUp(null)
    clearError()
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  /** Add a follow-up suggestion to the checklist */
  const handleAddFollowUp = useCallback((fu) => {
    setChecklist((prev) => [
      ...prev,
      {
        id:       `followup-${Date.now()}`,
        question: fu.question,
        why:      fu.why,
        priority: 'Optional',
        status:   'unanswered',
      },
    ])
    setFollowUp(null)
  }, [])

  /** Retry after error */
  const handleRetry = useCallback(() => {
    clearError()
  }, [])

  /** Reset everything and go back to start */
  const handleRestart = useCallback(() => {
    apiResetSession()
    setSituation('')
    setChecklist([])
    setAnswers({})
    setCurrentIndex(0)
    setFollowUp(null)
    clearError()
    setScreen('input')
  }, [])

  // ── Render ────────────────────────────────────────────────────
  switch (screen) {
    case 'input':
      return (
        <SituationInput
          onSubmit={handleSituationSubmit}
          loading={loading}
          error={error}
        />
      )

    case 'list':
      return (
        <Checklist
          situation={situation}
          checklist={checklist}
          onGuide={handleStartGuided}
          onBack={handleRestart}
        />
      )

    case 'guided':
      return (
        <GuidedQuestion
          checklist={checklist}
          currentIndex={currentIndex}
          answers={answers}
          onAnswer={handleAnswer}
          onCouldNotCheck={handleCouldNotCheck}
          onBack={handleBack}
          onBackToChecklist={() => setScreen('list')}
          onFinish={() => setScreen('summary')}
          onAddFollowUp={handleAddFollowUp}
          followUp={followUp}
          loading={loading}
          error={error}
          onRetry={handleRetry}
        />
      )

    case 'summary':
      return (
        <Summary
          situation={situation}
          checklist={checklist}
          answers={answers}
          onRestart={handleRestart}
          onBackToChecklist={() => setScreen('list')}
        />
      )

    default:
      return null
  }
}
