import { useEffect, useMemo, useRef, useState } from 'react'
import { Music, Gauge, Play, List, Database, User, Crown, LogIn, RefreshCw, LogOut } from 'lucide-react'
import Calculator from './components/Calculator'
import Metronome from './components/Metronome'
import Sessions from './components/Sessions'
import Profile from './components/Profile'
import ProUpsell from './components/ProUpsell'
import SignIn from './components/SignIn'

function App() {
  const [bpm, setBpm] = useState(170)
  const [lastParams, setLastParams] = useState(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [pro, setPro] = useState(false)
  const [tokenExp, setTokenExp] = useState(null)
  const expiryTimerRef = useRef(null)
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const clearExpiryTimer = () => {
    if (expiryTimerRef.current) {
      try { clearTimeout(expiryTimerRef.current) } catch {}
      expiryTimerRef.current = null
    }
  }

  const handleSignOut = () => {
    clearExpiryTimer()
    setPro(false)
    setTokenExp(null)
    setCurrentUserId('')
    try {
      localStorage.removeItem('pro')
      localStorage.removeItem('pro_token')
      localStorage.removeItem('user_id')
    } catch {}
  }

  const scheduleExpiry = (expSeconds) => {
    clearExpiryTimer()
    if (!expSeconds) return
    const nowMs = Date.now()
    const expMs = expSeconds * 1000
    const msUntil = Math.max(0, expMs - nowMs)
    // Give a tiny grace period before clearing to avoid edge flicker
    const timeoutMs = msUntil + 500
    expiryTimerRef.current = setTimeout(() => {
      // Token expired → soft downgrade, keep identity
      try {
        localStorage.removeItem('pro')
        localStorage.removeItem('pro_token')
      } catch {}
      setPro(false)
      setTokenExp(null)
    }, timeoutMs)
  }

  // Verify Pro token helper
  const verifyToken = async (token) => {
    try {
      const resp = await fetch(`${backend}/api/pro/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token)
      })
      if (!resp.ok) throw new Error('invalid')
      const data = await resp.json()
      if (data?.pro) {
        try { localStorage.setItem('pro', '1') } catch {}
        setPro(true)
        if (data?.exp) {
          setTokenExp(data.exp)
          scheduleExpiry(data.exp)
        }
        return true
      }
    } catch (e) {
      // fall through
    }
    try {
      localStorage.removeItem('pro')
      localStorage.removeItem('pro_token')
    } catch {}
    setPro(false)
    setTokenExp(null)
    return false
  }

  const refreshPro = async () => {
    try {
      const uid = localStorage.getItem('user_id') || currentUserId || null
      if (!uid) throw new Error('Sign in to refresh Pro')
      const resp = await fetch(`${backend}/api/pro/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.detail || 'Could not refresh')
      if (data?.token) {
        try {
          localStorage.setItem('pro_token', data.token)
          localStorage.setItem('pro', '1')
        } catch {}
        await verifyToken(data.token)
      }
    } catch (e) {
      alert(e.message || 'Unable to refresh Pro. If you purchased, try signing in with your purchase email and press Claim Pro in the upsell card.')
    }
  }

  // On load, restore pro from URL/localStorage and verify token if present
  useEffect(() => {
    const url = new URL(window.location.href)
    const proFlag = url.searchParams.get('pro')
    const stored = localStorage.getItem('pro')
    const token = localStorage.getItem('pro_token')
    if (proFlag === '1' || stored === '1') setPro(true)
    if (token) {
      verifyToken(token)
    }
  }, [])

  // Visibility change: if we have a token with exp in past, downgrade immediately
  useEffect(() => {
    const onVis = () => {
      if (!tokenExp) return
      if (Date.now() >= tokenExp * 1000) {
        try {
          localStorage.removeItem('pro')
          localStorage.removeItem('pro_token')
        } catch {}
        setPro(false)
        setTokenExp(null)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [tokenExp])

  const handleStop = async ({ durationSeconds }) => {
    try {
      if (!lastParams || !bpm || durationSeconds <= 0) return
      const payload = {
        user_id: currentUserId || null,
        pace_value: lastParams.pace_value,
        pace_unit: lastParams.pace_unit,
        run_type: lastParams.run_type,
        target_bpm: bpm,
        duration_seconds: durationSeconds,
        notes: null,
      }
      const token = localStorage.getItem('pro_token')
      await fetch(`${backend}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })
    } catch (e) {
      console.error('Failed to log session', e)
    }
  }

  const handleProfileSaved = ({ user_id }) => {
    setCurrentUserId(user_id)
    // Persist lightweight sign-in across devices
    try { localStorage.setItem('user_id', user_id) } catch {}
  }

  const handleSignedIn = ({ user_id, pro_token }) => {
    setCurrentUserId(user_id)
    if (pro_token) {
      verifyToken(pro_token)
    }
  }

  // Restore lightweight sign-in from localStorage
  useEffect(() => {
    const uid = localStorage.getItem('user_id')
    if (uid) setCurrentUserId(uid)
  }, [])

  const expMinutesRemaining = useMemo(() => {
    if (!tokenExp) return null
    const diffMs = tokenExp * 1000 - Date.now()
    if (diffMs <= 0) return 0
    return Math.ceil(diffMs / 60000)
  }, [tokenExp])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-100">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white grid place-items-center">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Runner's</p>
            <h1 className="text-xl font-bold text-gray-900">Metronome</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pro ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-100 px-2 py-1 rounded text-xs font-medium"><Crown className="h-4 w-4"/> Pro</span>
          ) : null}
          {pro && typeof expMinutesRemaining === 'number' && (
            <span className="text-xs text-gray-600">{expMinutesRemaining === 0 ? 'Token expired' : `Token expires in ~${expMinutesRemaining}m`}</span>
          )}
          {pro && (
            <button onClick={refreshPro} className="inline-flex items-center gap-1.5 text-xs bg-white/80 hover:bg-white px-2 py-1 rounded border">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh Pro
            </button>
          )}
          {currentUserId ? (
            <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded border border-rose-200">
              <LogOut className="h-3.5 w-3.5"/> Sign out
            </button>
          ) : null}
          <a href="/test" className="inline-flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-900">
            <Database className="h-4 w-4" /> Backend Test
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {!pro && (
          <section className="mb-8">
            <ProUpsell onActivate={setPro} userId={currentUserId} />
          </section>
        )}

        <section className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Gauge className="h-5 w-5"/> Cadence Calculator</h2>
            <Calculator onBpm={setBpm} onParams={setLastParams} />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Play className="h-5 w-5"/> Metronome</h2>
            <Metronome bpm={bpm} onStop={handleStop} />
            <p className="text-xs text-gray-500">Tip: use headphones. Volume depends on your device settings.</p>
          </div>
        </section>

        <section className="mt-10 grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><User className="h-5 w-5"/> Profile</h2>
            <Profile onSaved={handleProfileSaved} initialUserId={currentUserId} />
            <p className="text-xs text-gray-600">Enter an ID or email to create your profile. Sessions you record will be linked to this ID.</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><List className="h-5 w-5"/> Sessions</h2>
            <Sessions userId={currentUserId || null} pro={pro} />
            <p className="text-xs text-gray-600">Showing {currentUserId ? 'your sessions' : 'all recent sessions'}. Unlock Pro for full history.</p>
          </div>
        </section>

        <section className="mt-10 grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><LogIn className="h-5 w-5"/> Sign in</h2>
            <SignIn onSignedIn={handleSignedIn} />
            <p className="text-xs text-gray-600">Passwordless sign-in with a one-time code sent to your email. In development, the code is shown after you request it.</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Quick session</h3>
            <p className="text-sm text-gray-600 mb-4">Set your pace and run type, start the metronome, and go. When you stop, a brief session log is saved.</p>
            <div className="flex flex-wrap gap-2">
              {[150,160,165,170,175,180,185,190].map(v => (
                <button key={v} onClick={()=>setBpm(v)} className={`px-3 py-1.5 rounded border text-sm ${bpm===v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50'}`}>{v} bpm</button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
