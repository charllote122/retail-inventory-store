import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import merchantClient from '../api/merchantClient'
import { useMerchantAuth } from '../context/MerchantAuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SUGGESTED_CATEGORIES = [
    'Clothing', 'Accessories', 'Beauty', 'Sports', 'Home & Kitchen',
    'Electronics', 'Books', 'Toys', 'Furniture', 'Bedding', 'Groceries',
    'Automotive', 'Health', 'Garden', 'Pet Supplies', 'Office', 'Art',
    'Jewelry', 'Footwear', 'Watches', 'Bags', 'Handbags',
]

export default function MerchantDashboard() {
    const { merchant, loading: authLoading, logout } = useMerchantAuth()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [products, setProducts] = useState([])
    const [predictions, setPredictions] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [search, setSearch] = useState('')

    // Form state
    const [name, setName] = useState('')
    const [category, setCategory] = useState('Clothing')
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
                merchantClient.get('/api/products?limit=500'),
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
                category: category.trim(),
                price_usd: parseFloat(price),
                stock_quantity: parseInt(stock),
                image_url: imageUrl || null,
            })
            setName(''); setPrice(''); setStock(''); setCategory('Clothing')
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

    // Client-side search filter on dashboard
    const filteredProducts = search.trim()
        ? products.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category?.toLowerCase().includes(search.toLowerCase())
        )
        : products

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
            <header className="bg-slate-900 text-white sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-xl font-bold truncate">
                                {merchant.store_name}
                            </h1>
                            <p className="text-xs text-slate-400 truncate">
                                Merchant dashboard · {merchant.store_slug}
                            </p>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
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

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded hover:bg-slate-800 transition"
                            aria-label="Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-slate-700 py-3 space-y-2">
                            <Link
                                to={`/store/${merchant.store_slug}`}
                                target="_blank"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-2 py-2 text-sm text-slate-300 hover:text-white rounded"
                            >
                                View storefront ↗
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-2 py-2 text-sm text-slate-300 hover:text-white rounded"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">
                            Products
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{products.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">
                            Total stock
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {products.reduce((s, p) => s + p.stock_quantity, 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-5 col-span-2 md:col-span-1">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">
                            AI predictions ready
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                            {Object.keys(predictions).length}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Products panel */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                    <div className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                            Products
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="text-xs sm:text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {showForm ? 'Cancel' : '+ Add product'}
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    {!loading && products.length > 0 && (
                        <div className="px-4 sm:px-6 py-3 border-b bg-slate-50">
                            <input
                                type="text"
                                placeholder="Search products by name or category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            />
                        </div>
                    )}

                    {/* Add product form */}
                    {showForm && (
                        <form onSubmit={handleAddProduct} className="px-4 sm:px-6 py-5 border-b bg-slate-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product image
                                    </label>
                                    <div className="flex items-start gap-4">
                                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-400 text-center px-2">No image</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/gif"
                                                onChange={handleFileSelect}
                                                className="block w-full text-xs sm:text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <div>
                                        <input
                                            type="text"
                                            list="category-suggestions"
                                            placeholder="Category (e.g., Furniture, Cars, Duvets)"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <datalist id="category-suggestions">
                                            {SUGGESTED_CATEGORIES.map((c) => (
                                                <option key={c} value={c} />
                                            ))}
                                        </datalist>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Type any category — furniture, cars, anything.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number" step="0.01" placeholder="Price USD" value={price}
                                            onChange={(e) => setPrice(e.target.value)} required min="0.01"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <input
                                            type="number" placeholder="Stock" value={stock}
                                            onChange={(e) => setStock(e.target.value)} required min="0"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="mt-5 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm font-medium"
                            >
                                {uploading ? 'Please wait…' : 'Create product'}
                            </button>
                        </form>
                    )}

                    {/* Loading / empty / product list */}
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 animate-pulse">
                                    <div className="w-12 h-12 bg-slate-200 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <p className="text-gray-600 mb-4">No products yet. Add one to get started.</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="text-gray-600">No products match "{search}"</p>
                            <button
                                onClick={() => setSearch('')}
                                className="text-blue-600 hover:underline text-sm mt-2"
                            >
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
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
                                        {filteredProducts.map((p) => {
                                            const pred = predictions[p.id]
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-3">
                                                        {p.image_url ? (
                                                            <img
                                                                src={`${API_URL}${p.image_url}`}
                                                                alt={p.name}
                                                                className="w-12 h-12 object-contain bg-slate-50 rounded border"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                                                                <span className="text-xs text-gray-400">—</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-gray-900 max-w-xs truncate">{p.name}</td>
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
                                                            className="text-red-600 hover:underline text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile card list */}
                            <div className="md:hidden divide-y">
                                {filteredProducts.map((p) => {
                                    const pred = predictions[p.id]
                                    return (
                                        <div key={p.id} className="p-4 flex gap-3">
                                            <div className="flex-shrink-0">
                                                {p.image_url ? (
                                                    <img
                                                        src={`${API_URL}${p.image_url}`}
                                                        alt={p.name}
                                                        className="w-16 h-16 object-contain bg-slate-50 rounded border"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-slate-100 rounded border"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 text-sm line-clamp-2">{p.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{p.category}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        ${Number(p.price_usd).toFixed(2)}
                                                    </span>
                                                    <span className={`text-xs ${p.stock_quantity < p.low_stock_threshold ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                                        {p.stock_quantity} in stock
                                                    </span>
                                                </div>
                                                {pred ? (
                                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                                        AI: {pred.predicted_units_next_week} units next week
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-slate-400 mt-1">No AI forecast</p>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="text-xs text-red-600 hover:underline mt-2"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}