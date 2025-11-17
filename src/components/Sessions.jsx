import { useEffect, useState } from 'react'

export default function Sessions({ userId = null, pro = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [usedPro, setUsedPro] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    // Show the mini legend only once per device
    try {
      const seen = localStorage.getItem('sessions_legend_seen') === '1'
      setShowLegend(!seen)
    } catch {
      setShowLegend(true)
    }
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
      const token = localStorage.getItem('pro_token')
      setUsedPro(!!token)
      const resp = await fetch(`${backend}/api/sessions${qs}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await resp.json()
      setItems(data.items || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  const claimAndReload = async () => {
    try {
      if (!userId) {
        alert('Sign in to use Pro with your session history.')
        return
      }
      const resp = await fetch(`${backend}/api/pro/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.detail || 'Unable to claim Pro')
      if (data?.token) {
        try {
          localStorage.setItem('pro_token', data.token)
          localStorage.setItem('pro', '1')
        } catch {}
        await load()
      }
    } catch (e) {
      alert(e.message || 'Could not enable Pro for history. If you already purchased, try the Claim Pro button in the upgrade card.')
    }
  }

  const dismissLegend = () => {
    try { localStorage.setItem('sessions_legend_seen', '1') } catch {}
    setShowLegend(false)
  }

  const goToProBenefits = () => {
    try { window.location.hash = 'pro' } catch {}
    dismissLegend()
  }

  const cappedCount = !pro && items.length > 5 ? 5 : null
  const totalCount = items.length

  return (
    <div className="bg-white/70 backdrop-blur p-4 rounded-lg shadow border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800">Recent sessions</h3>
          <span className={`text-xs px-2 py-0.5 rounded border ${usedPro ? 'text-amber-700 bg-amber-100 border-amber-200' : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
            {usedPro ? 'Pro (JWT)' : 'Free'}
          </span>
          <button
            type="button"
            aria-label="What’s this?"
            title="What’s this?"
            onClick={() => setShowLegend(true)}
            className="ml-1 text-[10px] leading-none w-4 h-4 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            ?
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!usedPro && userId && (
            <button onClick={claimAndReload} className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-1 rounded">
              Use Pro
            </button>
          )}
          <button onClick={load} className="text-sm text-indigo-700 hover:text-indigo-900">Refresh</button>
        </div>
      </div>

      {showLegend && (
        <div className="mb-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p>
                • The chip shows if your history request used a Pro token.<br />
                • Rows that are dimmed are beyond the Free limit. Unlock with Pro to reveal them.<br />
                • “Use Pro” activates your purchase on this device if you’ve already upgraded.
              </p>
              <button onClick={goToProBenefits} className="mt-2 inline-block text-indigo-700 hover:text-indigo-900 underline">
                See full Pro benefits
              </button>
            </div>
            <button onClick={dismissLegend} className="shrink-0 text-indigo-700 hover:text-indigo-900 underline">Got it</button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {(!loading && totalCount === 0) && <p className="text-sm text-gray-500">No sessions yet.</p>}

      {!loading && totalCount > 0 && (
        <>
          <ul className="divide-y">
            {items.map((s, idx) => {
              const hidden = !pro && idx >= 5
              return (
                <li key={s._id} className={`py-3 flex items-center justify-between transition ${hidden ? 'opacity-40 grayscale pointer-events-none select-none' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.run_type} • {s.target_bpm} bpm</p>
                    <p className="text-xs text-gray-500">{s.pace_value} {s.pace_unit.replace('_','/')} • {s.duration_seconds}s</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString?.() || ''}</p>
                </li>
              )
            })}
          </ul>
          {!pro && totalCount > 5 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-600">Showing {cappedCount} of {totalCount}. Unlock Pro to see full history.</p>
              {!usedPro && userId && (
                <button onClick={claimAndReload} className="text-xs text-indigo-700 hover:text-indigo-900 underline">
                  Use Pro to unlock
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
