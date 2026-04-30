import { useEffect, useState } from 'react'
import emailjs from '@emailjs/browser'
import { useRevealUiStore } from '../store/useRevealUiStore'

const EMAILJS_PUBLIC_KEY = 'gGpo_UCDcL0yfGFEc'
const B2C_SERVICE_ID = 'jdd_b2c'
const B2C_TEMPLATE_ID = 'template_msr0tii'

/**
 * Post-reveal modal — fades in once all realm label animations have completed.
 * Acts as a private access / email query form floating over the desert scene.
 */
export default function DesertRevealModal() {
  const horizonReady = useRevealUiStore((s) => s.horizonHotspotVisible)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!horizonReady) {
      setVisible(false)
      setDismissed(false)
      setSubmitted(false)
      setSending(false)
      setError(null)
      setEmail('')
      return undefined
    }

    if (horizonReady && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [horizonReady, dismissed])

  useEffect(() => {
    if (!visible) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setDismissed(true)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible])

  if (!visible || dismissed) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)

    try {
      await emailjs.send(B2C_SERVICE_ID, B2C_TEMPLATE_ID, { email }, EMAILJS_PUBLIC_KEY)
      setSubmitted(true)
    } catch (err) {
      console.error('EmailJS B2C error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="desert-reveal-overlay"
      role="presentation"
      onClick={() => setDismissed(true)}
    >
      <div
        className="desert-reveal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Request access"
        onClick={(e) => e.stopPropagation()}
      >
        {!submitted ? (
          <>
            <h2 className="desert-reveal-panel__title">Access Is Private</h2>

            <div className="desert-reveal-panel__rule" aria-hidden="true" />

            <div className="desert-reveal-panel__copy">
              <p>The desert is visible.<br />Access is selective.</p>
              <p>Full state access is released<br />through selected properties.</p>
            </div>

            <form className="desert-reveal-panel__form" onSubmit={handleSubmit}>
              <div className="desert-reveal-panel__form-label">Request Access</div>
              <div className="desert-reveal-panel__field">
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email address"
                />
              </div>
              {error && <div className="desert-reveal-panel__error">{error}</div>}
              <button className="desert-reveal-panel__btn" type="submit" disabled={sending}>
                <span>{sending ? 'Sending…' : 'Submit'}</span>
                {!sending && <span aria-hidden="true">→</span>}
              </button>
            </form>
          </>
        ) : (
          <div className="desert-reveal-panel__confirmation">
            <h2 className="desert-reveal-panel__title">Received</h2>
            <div className="desert-reveal-panel__rule" aria-hidden="true" />
            <div className="desert-reveal-panel__copy">
              <p>Your request has been noted.<br />We will reach out personally.</p>
            </div>
            <button
              className="desert-reveal-panel__ghost"
              onClick={() => setDismissed(true)}
            >
              ← Return to the Desert
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
