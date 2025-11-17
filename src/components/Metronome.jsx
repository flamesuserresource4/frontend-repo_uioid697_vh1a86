import { useEffect, useRef, useState } from 'react'

// Simple WebAudio-based metronome with basic drift correction
export default function Metronome({ bpm, onTick }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [accentEvery, setAccentEvery] = useState(4)
  const audioCtxRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  const currentNoteRef = useRef(0)
  const schedulerIdRef = useRef(null)

  const secondsPerBeat = bpm > 0 ? 60.0 / bpm : 0.5

  const scheduleClick = (time, isAccent) => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Accent is higher pitch, normal is lower
    osc.frequency.value = isAccent ? 1200 : 900
    gain.gain.value = isAccent ? 0.2 : 0.12

    osc.connect(gain)
    gain.connect(ctx.destination)

    const clickLen = 0.03
    osc.start(time)
    osc.stop(time + clickLen)

    if (onTick) onTick({ time, isAccent })
  }

  const scheduler = () => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    // Schedule a small lookahead window
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const isAccent = currentNoteRef.current % accentEvery === 0
      scheduleClick(nextNoteTimeRef.current, isAccent)
      nextNoteTimeRef.current += secondsPerBeat
      currentNoteRef.current += 1
    }
    schedulerIdRef.current = setTimeout(scheduler, 25)
  }

  const start = async () => {
    if (isPlaying) return
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') await ctx.resume()

    currentNoteRef.current = 0
    nextNoteTimeRef.current = ctx.currentTime + 0.05
    setIsPlaying(true)
    scheduler()
  }

  const stop = async () => {
    setIsPlaying(false)
    if (schedulerIdRef.current) clearTimeout(schedulerIdRef.current)
    schedulerIdRef.current = null
    // Don't close the context to allow quick restart
  }

  // If BPM changes while playing, adjust step size automatically
  useEffect(() => {
    // nothing extra, secondsPerBeat is derived
  }, [bpm])

  useEffect(() => {
    return () => {
      if (schedulerIdRef.current) clearTimeout(schedulerIdRef.current)
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  return (
    <div className="bg-white/70 backdrop-blur p-4 rounded-lg shadow border">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Target</p>
          <p className="text-4xl font-bold text-gray-900">{bpm || '--'}<span className="text-base font-medium text-gray-500"> bpm</span></p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Accent</label>
          <select
            value={accentEvery}
            onChange={(e) => setAccentEvery(parseInt(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {[2,3,4,5,6,7,8].map(n => (
              <option key={n} value={n}>/{n}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        {!isPlaying ? (
          <button onClick={start} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors">Start</button>
        ) : (
          <button onClick={stop} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded transition-colors">Stop</button>
        )}
      </div>
    </div>
  )
}
