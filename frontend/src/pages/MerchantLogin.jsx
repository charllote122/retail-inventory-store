import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMerchantAuth } from '../context/MerchantAuthContext'

export default function MerchantLogin() {
    const navigate = useNavigate()
    const { login } = useMerchantAuth()
    const [email, setEmail] = useState('paytest@merchant.com')
    const [password, setPassword] = useState('merchant123')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await login(email, password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <Link to="/" className="text-sm text-gray-500 hover:underline">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">
                    Merchant sign in
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    Access your store admin dashboard
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:bg-gray-300 transition"
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    )
}