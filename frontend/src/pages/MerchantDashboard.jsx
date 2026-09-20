import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import merchantClient from '../api/merchantClient'
import { useMerchantAuth } from '../context/MerchantAuthContext'

export default function MerchantDashboard() {
    const { merchant, loading: authLoading, logout } = useMerchantAuth()
    const navigate = useNavigate()

    const [products, setProducts] = useState([])
    const [predictions, setPredictions] = useState({}) // { product_id: forecast }
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [category, setCategory] = useState('Electronics')
    const [price, setPrice] = useState('')
    const [stock, setStock] = useState('')

    useEffect(() => {
        if (!authLoading && !merchant) {
            navigate('/merchant/login')
        }
    }, [merchant, authLoading, navigate])

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const [prodRes, predRes] = await Promise.all([
                merchantClient.get('/api/products'),
                merchantClient.get('/api/merchant/predictions').catch(() => ({ data: { forecasts: [] } })),
            ])
            setProducts(prodRes.data)

            const predMap = {}
            for (const f of predRes.data.forecasts || []) {
                predMap[f.product_id] = f
            }
            setPredictions(predMap)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (merchant) loadData()
    }, [merchant])

    const handleAddProduct = async (e) => {
        e.preventDefault()
        setError(null)
        try {
            await merchantClient.post('/api/products', {
                name,
                category,
                price_usd: parseFloat(price),
                stock_quantity: parseInt(stock),
            })
            setName(''); setPrice(''); setStock('')
            setShowForm(false)
            await loadData()
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add product')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return
        try {
            await merchantClient.delete(`/api/products/${id}`)
            await loadData()
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete')
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    if (authLoading || !merchant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-gray-500">Loading…</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-900 text-white">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{merchant.store_name}</h1>
                        <p className="text-xs text-slate-400">Merchant dashboard · {merchant.store_slug}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to={`/store/${merchant.store_slug}`}
                            target="_blank"
                            className="text-sm text-slate-300 hover:text-white"
                        >
                            View storefront ↗
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-sm px-3 py-1.5 bg-slate-700 rounded hover:bg-slate-600 transition"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-5">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Products</p>
                        <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Total stock</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {products.reduce((s, p) => s + p.stock_quantity, 0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5">
                        <p className="text-xs uppercase tracking-wide text-gray-500">AI predictions ready</p>
                        <p className="text-3xl font-bold text-blue-600">{Object.keys(predictions).length}</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
                        {error}
                    </div>
                )}

                {/* Products */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            {showForm ? 'Cancel' : '+ Add product'}
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleAddProduct} className="px-6 py-4 border-b bg-slate-50 grid grid-cols-1 md:grid-cols-5 gap-3">
                            <input
                                type="text" placeholder="Product name" value={name}
                                onChange={(e) => setName(e.target.value)} required
                                className="px-3 py-2 border rounded md:col-span-2"
                            />
                            <select
                                value={category} onChange={(e) => setCategory(e.target.value)}
                                className="px-3 py-2 border rounded"
                            >
                                {['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty', 'Sports', 'Books', 'Toys'].map(c => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                            <input
                                type="number" step="0.01" placeholder="Price USD" value={price}
                                onChange={(e) => setPrice(e.target.value)} required min="0.01"
                                className="px-3 py-2 border rounded"
                            />
                            <input
                                type="number" placeholder="Stock" value={stock}
                                onChange={(e) => setStock(e.target.value)} required min="0"
                                className="px-3 py-2 border rounded"
                            />
                            <button type="submit" className="md:col-span-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Create product
                            </button>
                        </form>
                    )}

                    {loading ? (
                        <p className="p-6 text-gray-500">Loading…</p>
                    ) : products.length === 0 ? (
                        <p className="p-6 text-gray-500">No products yet. Add one to get started.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-gray-600">
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium">Product</th>
                                    <th className="text-left px-6 py-3 font-medium">Category</th>
                                    <th className="text-right px-6 py-3 font-medium">Price</th>
                                    <th className="text-right px-6 py-3 font-medium">Stock</th>
                                    <th className="text-right px-6 py-3 font-medium">AI forecast (7d)</th>
                                    <th className="text-right px-6 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {products.map((p) => {
                                    const pred = predictions[p.id]
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                                            <td className="px-6 py-3 text-gray-600">{p.category}</td>
                                            <td className="px-6 py-3 text-right text-gray-900">${Number(p.price_usd).toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right">
                                                <span className={p.stock_quantity < p.low_stock_threshold ? 'text-red-600 font-medium' : 'text-gray-700'}>
                                                    {p.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {pred ? (
                                                    <span className="text-blue-600 font-semibold">
                                                        {pred.predicted_units_next_week} units
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    )
}