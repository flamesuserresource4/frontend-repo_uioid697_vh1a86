import { Sparkles, ShieldCheck, Crown, BadgeCheck } from 'lucide-react'

export default function ProUpsell({ onActivate, userId = '' }) {
  const checkoutUrl = import.meta.env.VITE_PRO_CHECKOUT_URL || '#'
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const verifyToken = async (token) => {
    try {
      const resp = await fetch(`${backend}/api/pro/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token)
      })
      if (!resp.ok) return false
      const data = await resp.json()
      if (data?.pro) return true
    } catch {}
    return false
  }

  const claimForCurrentUser = async () => {
    const uid = userId || localStorage.getItem('user_id')
    if (!uid) {
      alert('Sign in first so we can attach Pro to your profile.')
      return
    }
    try {
      const resp = await fetch(`${backend}/api/pro/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.detail || 'No entitlement found for this user')
      if (data?.token) {
        localStorage.setItem('pro_token', data.token)
        localStorage.setItem('pro', '1')
        const ok = await verifyToken(data.token)
        if (ok) {
          onActivate && onActivate(true)
          alert('Pro activated for your profile on this device. Enjoy!')
        } else {
          throw new Error('Could not verify Pro token after claim')
        }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (e) {
      alert(e.message || 'Could not claim Pro. Make sure you are signed in with the purchase email.')
    }
  }

  const activateFromEmail = async () => {
    const email = window.prompt('Enter the email you used at checkout:')
    if (!email) return
    try {
      const resp = await fetch(`${backend}/api/pro/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.detail || 'No entitlement found')
      if (data?.token) {
        localStorage.setItem('pro', '1')
        localStorage.setItem('pro_token', data.token)
        const ok = await verifyToken(data.token)
        if (ok) {
          onActivate && onActivate(true)
          alert('Pro unlocked. Consider signing in so your sessions sync across devices.')
        } else {
          throw new Error('Could not verify Pro token after claim')
        }
      } else {
        throw new Error('Invalid response')
      }
    } catch (e) {
      alert(e.message || 'Could not verify purchase. Please try again later.')
    }
  }

  const startCheckout = async () => {
    try {
      const emailPrefill = window.prompt('Enter email for receipt (optional):') || undefined
      const resp = await fetch(`${backend}/api/checkout/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailPrefill })
      })
      const data = await resp.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('Could not create checkout session')
      }
    } catch (e) {
      // Fallback to static link if dynamic session not available
      if (checkoutUrl && checkoutUrl !== '#') {
        window.location.href = checkoutUrl
      } else {
        alert(e.message || 'Checkout unavailable. Please try again later.')
      }
    }
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
            <button onClick={startCheckout} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4"/> Unlock Pro — $5
            </button>
            <button onClick={activateFromEmail} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">I already paid</button>
            {(userId || localStorage.getItem('user_id')) && (
              <button onClick={claimForCurrentUser} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-amber-600"/> Claim Pro for my profile
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Tip: If dynamic checkout is unavailable, set VITE_PRO_CHECKOUT_URL to your Stripe payment link. After paying, return here and click “I already paid” using the same email. If you are signed in, use “Claim Pro for my profile”.</p>
        </div>
      </div>
    </div>
  )
}
