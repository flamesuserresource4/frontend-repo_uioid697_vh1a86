import { useEffect, useState } from 'react'

export default function Sessions({ userId = null }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
      const resp = await fetch(`${backend}/api/sessions${qs}`)
      const data = await resp.json()
      setItems(data.items || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  return (
    <div className="bg-white/70 backdrop-blur p-4 rounded-lg shadow border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800">Recent sessions</h3>
        <button onClick={load} className="text-sm text-indigo-700 hover:text-indigo-900">Refresh</button>
      </div>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {(!loading && items.length === 0) && <p className="text-sm text-gray-500">No sessions yet.</p>}
      <ul className="divide-y">
        {items.map((s) => (
          <li key={s._id} className="py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{s.run_type} • {s.target_bpm} bpm</p>
              <p className="text-xs text-gray-500">{s.pace_value} {s.pace_unit.replace('_','/')} • {s.duration_seconds}s</p>
            </div>
            <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString?.() || ''}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
