import { useEffect, useState } from 'react'

export default function Profile({ onSaved, initialUserId = '' }) {
  const [userId, setUserId] = useState(initialUserId)
  const [displayName, setDisplayName] = useState('')
  const [preferredUnit, setPreferredUnit] = useState('min_per_km')
  const [baseline, setBaseline] = useState('')
  const [target, setTarget] = useState('')
  const [runType, setRunType] = useState('easy')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const loadProfile = async (uid) => {
    if (!uid) return
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${backend}/api/profile?user_id=${encodeURIComponent(uid)}`)
      if (resp.status === 404) { setMessage('No profile yet — create one below.'); return }
      const data = await resp.json()
      setDisplayName(data.display_name || '')
      setPreferredUnit(data.preferred_unit || 'min_per_km')
      setBaseline(data.baseline_cadence || '')
      setTarget(data.target_cadence || '')
      setRunType(data.run_type || 'easy')
      setMessage('Loaded profile')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile(userId) }, [])

  const save = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const payload = {
        user_id: userId,
        display_name: displayName || undefined,
        preferred_unit: preferredUnit,
        baseline_cadence: baseline ? parseInt(baseline) : undefined,
        target_cadence: target ? parseInt(target) : undefined,
        run_type: runType || undefined,
      }
      const resp = await fetch(`${backend}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      setMessage('Saved')
      onSaved && onSaved({ id: data.id, user_id: userId })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur p-4 rounded-lg shadow border">
      <h3 className="text-base font-semibold text-gray-800 mb-3">Profile</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-sm text-gray-600">User ID or email</label>
          <input value={userId} onChange={e=>setUserId(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="you@example.com or any ID" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Display name</label>
          <input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Preferred unit</label>
          <select value={preferredUnit} onChange={e=>setPreferredUnit(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="min_per_km">min/km</option>
            <option value="min_per_mile">min/mile</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Baseline cadence</label>
          <input type="number" value={baseline} onChange={e=>setBaseline(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., 170" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Target cadence</label>
          <input type="number" value={target} onChange={e=>setTarget(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., 175" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Default run type</label>
          <select value={runType} onChange={e=>setRunType(e.target.value)} className="w-full border rounded px-3 py-2">
            {['recovery','easy','long','tempo','interval','sprint'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2 flex gap-2 mt-2">
          <button onClick={() => loadProfile(userId)} className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm">Load</button>
          <button onClick={save} disabled={!userId || loading} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50">{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      {message && <p className="text-sm text-emerald-700 mt-3">{message}</p>}
      {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
    </div>
  )
}
