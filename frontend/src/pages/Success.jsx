import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api/client'

export default function Success() {
    const [params] = useSearchParams()
    const sessionId = params.get('session_id')
    const [status, setStatus] = useState('checking')
    const [orderId, setOrderId] = useState(null)

    useEffect(() => {
        if (!sessionId) {
            setStatus('error')
            return
        }

        // Poll every 2s until status is "paid" or give up after 15s
        let attempts = 0
        const interval = setInterval(async () => {
            attempts++
            try {
                const res = await api.get(`/api/stripe/session-status/${sessionId}`)
                setOrderId(res.data.order_id)

                if (res.data.payment_status === 'paid') {
                    setStatus('paid')
                    clearInterval(interval)
                } else if (attempts >= 8) {
                    setStatus('pending')
                    clearInterval(interval)
                }
            } catch {
                if (attempts >= 8) {
                    setStatus('error')
                    clearInterval(interval)
                }
            }
        }, 2000)

        return () => clearInterval(interval)
    }, [sessionId])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white rounded-lg shadow p-10 max-w-md text-center">
                {status === 'checking' && (
                    <p className="text-gray-600">Confirming your payment…</p>
                )}

                {status === 'paid' && (
                    <>
                        <div className="text-6xl mb-4">✅</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Payment successful
                        </h1>
                        {orderId && (
                            <p className="text-gray-600 mb-6">Order #{orderId} confirmed</p>
                        )}
                        <Link to="/" className="text-blue-600 hover:underline">
                            ← Back to shopping
                        </Link>
                    </>
                )}

                {status === 'pending' && (
                    <>
                        <p className="text-gray-600">
                            Payment is being processed. You'll receive a confirmation shortly.
                        </p>
                        <Link to="/" className="text-blue-600 hover:underline mt-4 block">
                            ← Back to shopping
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <p className="text-red-600">Could not confirm payment.</p>
                        <Link to="/" className="text-blue-600 hover:underline mt-4 block">
                            ← Back to shopping
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}