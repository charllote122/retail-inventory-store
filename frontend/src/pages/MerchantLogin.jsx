import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMerchantAuth } from '../context/MerchantAuthContext'

export default function MerchantLogin() {
    const navigate = useNavigate()
    const { login, register } = useMerchantAuth()
    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('paytest@merchant.com')
    const [password, setPassword] = useState('merchant123')
    const [storeName, setStoreName] = useState('')
    const [storeSlug, setStoreSlug] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            if (mode === 'login') {
                await login(email, password)
            } else {
                await register({
                    email,
                    password,
                    store_name: storeName,
                    store_slug: storeSlug,
                })
            }
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <Link to="/" className="text-sm text-gray-500 hover:underline">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">
                    {mode === 'login' ? 'Merchant sign in' : 'Create your store'}
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    {mode === 'login'
                        ? 'Access your store admin dashboard'
                        : 'Launch your own online store in minutes'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {mode === 'register' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Store name
                                </label>
                                <input
                                    type="text"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    required
                                    minLength={2}
                                    placeholder="e.g., Urban Living Furniture"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Store URL
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                                        /store/
                                    </span>
                                    <input
                                        type="text"
                                        value={storeSlug}
                                        onChange={(e) =>
                                            setStoreSlug(
                                                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                                            )
                                        }
                                        required
                                        minLength={2}
                                        placeholder="urban-living"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Your storefront will be at{' '}
                                    <code className="bg-slate-100 px-1 rounded">
                                        /store/{storeSlug || 'your-slug'}
                                    </code>
                                </p>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-gray-300 transition font-medium"
                    >
                        {loading
                            ? 'Please wait…'
                            : mode === 'login'
                                ? 'Sign in'
                                : 'Create store'}
                    </button>
                </form>

                <button
                    onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login')
                        setError(null)
                    }}
                    className="mt-4 text-sm text-blue-600 hover:underline w-full text-center"
                >
                    {mode === 'login'
                        ? "Don't have a store? Create one"
                        : 'Already have a store? Sign in'}
                </button>
            </div>
        </div>
    )
}