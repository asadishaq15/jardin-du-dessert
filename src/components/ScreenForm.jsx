import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { useAppStore } from '../store/useAppStore'

const EMAILJS_PUBLIC_KEY = 'gGpo_UCDcL0yfGFEc'
const B2B_SERVICE_ID = 'jdd_b2b'
const B2B_TEMPLATE_ID = 'template_t0g08el'

export default function ScreenForm() {
  const setScreen = useAppStore((s) => s.setScreen)
  const currentState = useAppStore((s) => s.currentState)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    const form = e.target
    const templateParams = {
      property: form.property.value,
      location: form.location.value,
      concept: form.concept.value,
      email: form.email.value,
      realm: currentState ? currentState.realmKey : '—',
      state_name: currentState ? currentState.name : '—',
      state_core: currentState ? currentState.core : '—',
      state_biz: currentState ? currentState.biz : '—',
      state_status: currentState ? currentState.status : '—',
    }

    try {
      await emailjs.send(B2B_SERVICE_ID, B2B_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
      setScreen('submitted')
    } catch (err) {
      console.error('EmailJS B2B error:', err)
      setError('Something went wrong. Please try again.')
      setSending(false)
    }
  }

  return (
    <section className="screen screen-form active">
      <div className="form-head">
        <div className="micro">RESIDENCY · 03 / 04</div>
        <h2>Apply for Residency</h2>
        <div className="selected-state">
          SELECTED STATE <strong>{currentState ? currentState.name : '—'}</strong>
        </div>
      </div>
      <form className="form-body" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="f-property">Property Name</label>
          <input id="f-property" name="property" type="text" placeholder="e.g. Atelier Ibiza" required />
        </div>
        <div className="field">
          <label htmlFor="f-location">Location · City / Country</label>
          <input id="f-location" name="location" type="text" placeholder="e.g. Ibiza, Spain" required />
        </div>
        <div className="field">
          <label htmlFor="f-concept">Concept</label>
          <input id="f-concept" name="concept" type="text" placeholder="one-line concept" required />
        </div>
        <div className="field">
          <label htmlFor="f-email">Contact Email</label>
          <input id="f-email" name="email" type="email" placeholder="you@property.com" required />
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={sending}>
            {sending ? 'SENDING…' : 'SECURE THE CODE'}
          </button>
          <button className="btn--ghost" type="button" onClick={() => setScreen('states')}>← BACK</button>
        </div>
      </form>
    </section>
  )
}
