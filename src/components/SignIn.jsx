import { useState } from 'react'
import { Mail, CheckCircle2 } from 'lucide-react'

export default function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('enter_email') // enter_email | enter_code | done
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const requestCode = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const resp = await fetch(`${backend}/api/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.detail || 'Could not send code')
      setStep('enter_code')
      if (data.debug_code) {
        setMessage(`Dev code: ${data.debug_code}`)
        setCode(data.debug_code)
      } else {
        setMessage('Check your email for a 6-digit code')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const resp = await fetch(`${backend}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.detail || 'Invalid code')
      // Persist identity and optional pro token
      try { localStorage.setItem('user_id', data.user_id) } catch {}
      if (data.pro_token) {
        try {
          localStorage.setItem('pro', '1')
          localStorage.setItem('pro_token', data.pro_token)
        } catch {}
      }
      onSignedIn && onSignedIn({ user_id: data.user_id, pro_token: data.pro_token || null })
      setStep('done')
      setMessage('Signed in')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur p-4 rounded-lg shadow border">
      <h3 className="text-base font-semibold text-gray-800 mb-3">Sign in (email)</h3>
      {step === 'enter_email' && (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="you@example.com" />
          </div>
          <button onClick={requestCode} disabled={!email || loading} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50 inline-flex items-center gap-2">
            <Mail className="h-4 w-4"/> Send code
          </button>
        </div>
      )}

      {step === 'enter_code' && (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">6-digit code</label>
            <input value={code} onChange={e=>setCode(e.target.value)} className="w-full border rounded px-3 py-2 tracking-widest" placeholder="••••••" />
          </div>
          <button onClick={verifyCode} disabled={!code || loading} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4"/> Verify & continue
          </button>
          <button onClick={()=>setStep('enter_email')} className="text-sm text-gray-600 underline">Use a different email</button>
        </div>
      )}

      {step === 'done' && (
        <p className="text-sm text-emerald-700">You're signed in. You can now save your profile and your sessions will be linked to your email.</p>
      )}

      {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
      {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
    </div>
  )
}
