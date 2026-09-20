import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function Cart() {
    const { items, removeFromCart, total, itemCount, clearCart } = useCart()
    const { customer, token } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (itemCount === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                    <Link to="/" className="text-blue-600 hover:underline">← Browse stores</Link>
                </div>
            </div>
        )
    }

    const handleCheckout = async () => {
        setError(null)

        if (!token || !customer) {
            navigate('/login')
            return
        }

        setLoading(true)
        try {
            // 1. Create the order
            const orderRes = await api.post('/api/orders', {
                items: items.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                })),
                shipping_address: 'Default address',
            })
            const orderId = orderRes.data.id

            // 2. Create the Stripe checkout session
            const sessionRes = await api.post(
                `/api/stripe/create-checkout-session/${orderId}`
            )

            // 3. Redirect to Stripe
            clearCart()
            window.location.href = sessionRes.data.checkout_url
        } catch (err) {
            setError(err.response?.data?.detail || 'Checkout failed')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <Link to="/" className="text-sm text-gray-500 hover:underline">
                            ← Back to shopping
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">Your Cart</h1>
                    </div>
                    {customer && (
                        <p className="text-sm text-gray-600">
                            Signed in as <strong>{customer.email}</strong>
                        </p>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="bg-white rounded-lg shadow divide-y">
                    {items.map((item) => (
                        <div key={item.product_id} className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-600">
                                    ${item.price_usd.toFixed(2)} × {item.quantity}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-gray-900">
                                    ${(item.price_usd * item.quantity).toFixed(2)}
                                </span>
                                <button
                                    onClick={() => removeFromCart(item.product_id)}
                                    className="text-sm text-red-600 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 bg-white rounded-lg shadow p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</p>
                    </div>
                    <button
                        onClick={clearCart}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Clear cart
                    </button>
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="mt-6 w-full py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
                >
                    {loading
                        ? 'Redirecting to Stripe…'
                        : token
                            ? 'Checkout with Stripe'
                            : 'Sign in to checkout'}
                </button>
            </main>
        </div>
    )
}