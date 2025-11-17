import { useState } from 'react'
import { Music, Gauge, Play, List, Database, Save } from 'lucide-react'
import Calculator from './components/Calculator'
import Metronome from './components/Metronome'

function App() {
  const [bpm, setBpm] = useState(170)
  const [lastParams, setLastParams] = useState(null)
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const handleStop = async ({ durationSeconds }) => {
    try {
      if (!lastParams || !bpm || durationSeconds <= 0) return
      const payload = {
        user_id: null,
        pace_value: lastParams.pace_value,
        pace_unit: lastParams.pace_unit,
        run_type: lastParams.run_type,
        target_bpm: bpm,
        duration_seconds: durationSeconds,
        notes: null,
      }
      await fetch(`${backend}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      // Optional: toast/feedback could be added
    } catch (e) {
      console.error('Failed to log session', e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50">
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
        <a href="/test" className="inline-flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-900">
          <Database className="h-4 w-4" /> Backend Test
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
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

        <section className="mt-10 bg-white/70 backdrop-blur p-6 rounded-xl border">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Quick session</h3>
          <p className="text-sm text-gray-600 mb-4">Set your pace and run type, start the metronome, and go. When you stop, a brief session log is saved.</p>
          <div className="flex flex-wrap gap-2">
            {[150,160,165,170,175,180,185,190].map(v => (
              <button key={v} onClick={()=>setBpm(v)} className={`px-3 py-1.5 rounded border text-sm ${bpm===v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50'}`}>{v} bpm</button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
