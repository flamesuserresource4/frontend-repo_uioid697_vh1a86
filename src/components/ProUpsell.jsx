import { Sparkles, ShieldCheck, Crown } from 'lucide-react'

export default function ProUpsell({ onActivate }) {
  const checkoutUrl = import.meta.env.VITE_PRO_CHECKOUT_URL || '#'

  const activateDemo = () => {
    try {
      localStorage.setItem('pro', '1')
      onActivate && onActivate(true)
    } catch {}
  }

  return (
    <div className="bg-white/80 backdrop-blur p-6 rounded-xl border shadow">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-amber-500 text-white grid place-items-center">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Go Pro — $5 one-time</h3>
          <p className="text-sm text-gray-600 mt-1">Unlock full session history and support development. A simple one-time purchase keeps the project running.</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600"/> Full session history (no 5-item cap)</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600"/> Pro badge and priority updates</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600"/> Thank-you shoutout in release notes</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={checkoutUrl} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4"/> Unlock Pro — $5
            </a>
            <button onClick={activateDemo} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">I already paid (demo)</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tip: Set VITE_PRO_CHECKOUT_URL to a Stripe payment link. After paying, you can return with ?pro=1 to unlock Pro on this device.</p>
        </div>
      </div>
    </div>
  )
}
