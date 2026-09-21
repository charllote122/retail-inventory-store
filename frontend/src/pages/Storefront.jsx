import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { SkeletonGrid } from '../components/Skeleton'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const normalizeCategory = (c) => {
    if (!c) return ''
    const t = c.trim()
    return t.charAt(0).toUpperCase() + t.slice(1)
}

const resolveImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${API_URL}${url}`
}

export default function Storefront() {
    const { slug } = useParams()
    const [store, setStore] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [sortBy, setSortBy] = useState('default')
    const { addToCart } = useCart()

    useEffect(() => {
        setLoading(true)
        setError(null)
        Promise.all([
            api.get(`/api/store/${slug}`),
            api.get(`/api/store/${slug}/products?limit=500`),
        ])
            .then(([s, p]) => {
                setStore(s.data)
                setProducts(p.data)
            })
            .catch((err) => setError(err.response?.data?.detail || 'Failed to load store'))
            .finally(() => setLoading(false))
    }, [slug])

    const categories = useMemo(() => {
        const cats = new Set(
            products.map((p) => normalizeCategory(p.category)).filter(Boolean)
        )
        return ['All', ...Array.from(cats).sort()]
    }, [products])

    const filtered = useMemo(() => {
        let result = products
        if (activeCategory !== 'All') {
            result = result.filter((p) => normalizeCategory(p.category) === activeCategory)
        }
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.category && p.category.toLowerCase().includes(q))
            )
        }
        if (sortBy === 'price-asc') {
            result = [...result].sort((a, b) => Number(a.price_usd) - Number(b.price_usd))
        } else if (sortBy === 'price-desc') {
            result = [...result].sort((a, b) => Number(b.price_usd) - Number(a.price_usd))
        } else if (sortBy === 'name') {
            result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        }
        return result
    }, [products, search, activeCategory, sortBy])

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Store not found</h1>
                <p className="text-slate-600 mb-6">{error}</p>
                <Link to="/" className="text-blue-600 hover:underline">
                    ← Back to all stores
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="mb-6">
                <Link to="/" className="text-sm text-slate-500 hover:underline">
                    ← All stores
                </Link>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
                    {loading ? 'Loading…' : store?.store_name}
                </h1>
                {!loading && store && (
                    <p className="text-sm text-slate-500 mt-1">
                        {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
                        {activeCategory !== 'All' && ` in ${activeCategory}`}
                        {search && ` matching "${search}"`}
                    </p>
                )}
            </div>

            {!loading && (
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    >
                        <option value="default">Sort: Featured</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name">Name: A–Z</option>
                    </select>
                </div>
            )}

            {!loading && categories.length > 1 && (
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition border ${activeCategory === cat
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <SkeletonGrid count={8} />
            ) : products.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-600">No products available yet.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-slate-600 mb-2">No products match your search.</p>
                    <button
                        onClick={() => { setSearch(''); setActiveCategory('All'); setSortBy('default') }}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filtered.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition overflow-hidden flex flex-col group"
                        >
                            <Link to={`/store/${slug}/product/${product.id}`} className="block">
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center h-40 sm:h-52 p-4">
                                    {product.image_url ? (
                                        <img
                                            src={resolveImageUrl(product.image_url)}
                                            alt={product.name}
                                            className="max-w-[140px] max-h-[140px] sm:max-w-[180px] sm:max-h-[180px] object-contain bg-white rounded shadow-sm group-hover:scale-105 transition-transform"
                                            onError={(e) => { e.target.style.display = 'none' }}
                                        />
                                    ) : (
                                        <span className="text-slate-400 text-sm">No image</span>
                                    )}
                                </div>
                            </Link>
                            <div className="p-3 sm:p-4 flex-1 flex flex-col">
                                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 mb-1">
                                    {product.category}
                                </p>
                                <Link
                                    to={`/store/${slug}/product/${product.id}`}
                                    className="font-medium text-slate-900 mb-2 hover:text-blue-600 line-clamp-2 text-xs sm:text-sm leading-snug"
                                >
                                    {product.name}
                                </Link>
                                <div className="mt-auto flex items-center justify-between gap-2">
                                    <span className="text-base sm:text-lg font-bold text-slate-900">
                                        ${Number(product.price_usd).toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => addToCart(product)}
                                        disabled={product.stock_quantity === 0}
                                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                                    >
                                        {product.stock_quantity === 0 ? 'Out' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}