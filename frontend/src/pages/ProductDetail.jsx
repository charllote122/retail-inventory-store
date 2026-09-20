import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useCart } from '../context/CartContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ProductDetail() {
    const { slug, id } = useParams()
    const { addToCart, itemCount } = useCart()

    const [product, setProduct] = useState(null)
    const [store, setStore] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [quantity, setQuantity] = useState(1)
    const [added, setAdded] = useState(false)

    // Zoom state
    const [zoom, setZoom] = useState(false)
    const [position, setPosition] = useState({ x: 50, y: 50 })
    const imageRef = useRef(null)

    useEffect(() => {
        setLoading(true)
        setError(null)

        Promise.all([
            api.get(`/api/store/${slug}`),
            api.get(`/api/store/${slug}/products/${id}`),
        ])
            .then(([storeRes, productRes]) => {
                setStore(storeRes.data)
                setProduct(productRes.data)
            })
            .catch((err) => {
                setError(err.response?.data?.detail || 'Product not found')
            })
            .finally(() => setLoading(false))
    }, [slug, id])

    const handleMouseMove = (e) => {
        if (!imageRef.current) return
        const rect = imageRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setPosition({ x, y })
    }

    const handleAddToCart = () => {
        if (!product) return
        addToCart(product, quantity)
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Loading…</p>
            </div>
        )
    }

    if (error || !product || !store) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Product not found</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link to={`/store/${slug}`} className="text-blue-600 hover:underline">
                        ← Back to store
                    </Link>
                </div>
            </div>
        )
    }

    const inStock = product.stock_quantity > 0
    const maxQty = Math.min(product.stock_quantity, 10)

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to={`/store/${slug}`} className="text-sm text-gray-500 hover:underline">
                        ← Back to {store.store_name}
                    </Link>
                    <Link
                        to="/cart"
                        className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Cart
                        {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                                {itemCount}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image with hover-zoom */}
                        <div className="bg-gray-50 flex items-center justify-center min-h-[500px] p-8">
                            {product.image_url ? (
                                <div
                                    ref={imageRef}
                                    className="relative w-full max-w-md aspect-square overflow-hidden rounded-lg bg-white shadow-sm cursor-zoom-in"
                                    onMouseEnter={() => setZoom(true)}
                                    onMouseLeave={() => setZoom(false)}
                                    onMouseMove={handleMouseMove}
                                >
                                    <img
                                        src={`${API_URL}${product.image_url}`}
                                        alt={product.name}
                                        className="w-full h-full object-contain transition-transform duration-200"
                                        style={{
                                            transform: zoom ? 'scale(2.5)' : 'scale(1)',
                                            transformOrigin: `${position.x}% ${position.y}%`,
                                        }}
                                        onError={(e) => { e.target.style.display = 'none' }}
                                    />

                                    {!zoom && (
                                        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 pointer-events-none">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                                            </svg>
                                            Hover to zoom
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-gray-400">No image</span>
                            )}
                        </div>

                        {/* Details */}
                        <div className="p-8 md:p-10 flex flex-col">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                                {product.category}
                            </p>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {product.name}
                            </h1>
                            <p className="text-3xl font-bold text-gray-900 mb-6">
                                ${Number(product.price_usd).toFixed(2)}
                            </p>

                            {product.description && (
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    {product.description}
                                </p>
                            )}

                            <div className="mb-6">
                                {inStock ? (
                                    <span className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        In stock ({product.stock_quantity} available)
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        Out of stock
                                    </span>
                                )}
                            </div>

                            {inStock && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 border border-gray-300 rounded hover:bg-gray-50 text-lg font-medium"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={maxQty}
                                            value={quantity}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 1
                                                setQuantity(Math.max(1, Math.min(maxQty, val)))
                                            }}
                                            className="w-20 px-3 py-2 border border-gray-300 rounded text-center"
                                        />
                                        <button
                                            onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                                            className="w-10 h-10 border border-gray-300 rounded hover:bg-gray-50 text-lg font-medium"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleAddToCart}
                                disabled={!inStock}
                                className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-lg"
                            >
                                {!inStock ? 'Out of stock' : added ? '✓ Added to cart' : 'Add to cart'}
                            </button>

                            {added && (
                                <Link
                                    to="/cart"
                                    className="mt-3 text-center text-blue-600 hover:underline text-sm"
                                >
                                    View cart and checkout →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}