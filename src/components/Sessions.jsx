import { useEffect, useState } from 'react'

export default function Sessions({ userId = null, pro = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [usedPro, setUsedPro] = useState(false)
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

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

  const visibleItems = pro ? items : items.slice(0, 5)

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

  return (
    <div className="bg-white/70 backdrop-blur p-4 rounded-lg shadow border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800">Recent sessions</h3>
          <span className={`text-xs px-2 py-0.5 rounded border ${usedPro ? 'text-amber-700 bg-amber-100 border-amber-200' : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
            {usedPro ? 'Pro (JWT)' : 'Free'}
          </span>
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
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {(!loading && visibleItems.length === 0) && <p className="text-sm text-gray-500">No sessions yet.</p>}
      <ul className="divide-y">
        {visibleItems.map((s) => (
          <li key={s._id} className="py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{s.run_type} • {s.target_bpm} bpm</p>
              <p className="text-xs text-gray-500">{s.pace_value} {s.pace_unit.replace('_','/')} • {s.duration_seconds}s</p>
            </div>
            <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString?.() || ''}</p>
          </li>
        ))}
      </ul>
      {!pro && items.length > 5 && (
        <p className="mt-3 text-xs text-gray-600">Showing 5 of {items.length}. Unlock Pro to see full history.</p>
      )}
    </div>
  )
}
