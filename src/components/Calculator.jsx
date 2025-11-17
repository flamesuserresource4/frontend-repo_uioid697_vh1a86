import { useEffect, useState } from 'react'

export default function Calculator({ onBpm, onParams }) {
  const [paceValue, setPaceValue] = useState(5.0)
  const [paceUnit, setPaceUnit] = useState('min_per_km')
  const [runType, setRunType] = useState('easy')
  const [baseline, setBaseline] = useState('')
  const [target, setTarget] = useState('')
  const [bpm, setBpm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const calculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${backend}/api/convert/pace-to-bpm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pace_value: parseFloat(paceValue),
          pace_unit: paceUnit,
          run_type: runType,
          baseline_cadence: baseline ? parseInt(baseline) : undefined,
          target_cadence: target ? parseInt(target) : undefined,
        })
      })
      const data = await resp.json()
      setBpm(data.bpm)
      onBpm && onBpm(data.bpm)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calculate()
    onParams && onParams({ pace_value: parseFloat(paceValue), pace_unit: paceUnit, run_type: runType })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paceValue, paceUnit, runType, baseline, target])

  return (
    <div className="bg-white/70 backdrop-blur p-4 rounded-lg shadow border">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Pace</label>
          <input type="number" step="0.1" value={paceValue} onChange={(e)=>setPaceValue(e.target.value)} className="w-full border rounded px-3 py-2" />
          <p className="text-xs text-gray-500 mt-1">Minutes per unit (e.g., 5.0 = 5:00)</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Unit</label>
          <select value={paceUnit} onChange={(e)=>setPaceUnit(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="min_per_km">min/km</option>
            <option value="min_per_mile">min/mile</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Run type</label>
          <select value={runType} onChange={(e)=>setRunType(e.target.value)} className="w-full border rounded px-3 py-2">
            {['recovery','easy','long','tempo','interval','sprint'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Baseline cadence (optional)</label>
          <input type="number" value={baseline} onChange={(e)=>setBaseline(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., 170" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Target cadence (optional)</label>
          <input type="number" value={target} onChange={(e)=>setTarget(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., 175" />
        </div>
        <div className="flex items-end">
          <button onClick={calculate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors" disabled={loading}>
            {loading ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">Recommended cadence</p>
        <p className="text-3xl font-bold text-gray-900">{bpm ?? '--'} <span className="text-base font-medium text-gray-500">bpm</span></p>
        {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
      </div>
    </div>
  )
}
