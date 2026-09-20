import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import merchantClient from '../api/merchantClient'
import { useMerchantAuth } from '../context/MerchantAuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function MerchantDashboard() {
    const { merchant, loading: authLoading, logout } = useMerchantAuth()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [products, setProducts] = useState([])
    const [predictions, setPredictions] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [category, setCategory] = useState('Electronics')
    const [price, setPrice] = useState('')
    const [stock, setStock] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [previewUrl, setPreviewUrl] = useState('')
    const [uploading, setUploading] = useState(false)

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
                merchantClient.get('/api/products?limit=500'),  // ← fetch all
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

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setPreviewUrl(URL.createObjectURL(file))
        setUploading(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await merchantClient.post('/api/products/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            setImageUrl(res.data.image_url)
        } catch (err) {
            setError(err.response?.data?.detail || 'Image upload failed')
            setPreviewUrl('')
            setImageUrl('')
        } finally {
            setUploading(false)
        }
    }

    const handleAddProduct = async (e) => {
        e.preventDefault()
        setError(null)
        try {
            await merchantClient.post('/api/products', {
                name,
                category,
                price_usd: parseFloat(price),
                stock_quantity: parseInt(stock),
                image_url: imageUrl || null,
            })
            setName(''); setPrice(''); setStock('')
            setImageUrl(''); setPreviewUrl('')
            if (fileInputRef.current) fileInputRef.current.value = ''
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
                        <form onSubmit={handleAddProduct} className="px-6 py-5 border-b bg-slate-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product image
                                    </label>
                                    <div className="flex items-start gap-4">
                                        <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center overflow-hidden">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-400 text-center px-2">No image</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/gif"
                                                onChange={handleFileSelect}
                                                className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            {uploading && (
                                                <p className="text-xs text-blue-600 mt-2">Uploading…</p>
                                            )}
                                            {imageUrl && !uploading && (
                                                <p className="text-xs text-green-600 mt-2">✓ Uploaded</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">
                                                JPG, PNG, WebP, GIF · max 5 MB
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        type="text" placeholder="Product name" value={name}
                                        onChange={(e) => setName(e.target.value)} required
                                        className="w-full px-3 py-2 border rounded"
                                    />
                                    <select
                                        value={category} onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 border rounded"
                                    >
                                        {['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty', 'Sports', 'Books', 'Toys'].map(c => (
                                            <option key={c}>{c}</option>
                                        ))}
                                    </select>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number" step="0.01" placeholder="Price USD" value={price}
                                            onChange={(e) => setPrice(e.target.value)} required min="0.01"
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                        <input
                                            type="number" placeholder="Stock" value={stock}
                                            onChange={(e) => setStock(e.target.value)} required min="0"
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="mt-5 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                {uploading ? 'Please wait…' : 'Create product'}
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
                                    <th className="text-left px-6 py-3 font-medium">Image</th>
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
                                            <td className="px-6 py-3">
                                                {p.image_url ? (
                                                    <img
                                                        src={`${API_URL}${p.image_url}`}
                                                        alt={p.name}
                                                        className="w-12 h-12 object-cover rounded border"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                                                        <span className="text-xs text-gray-400">—</span>
                                                    </div>
                                                )}
                                            </td>
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