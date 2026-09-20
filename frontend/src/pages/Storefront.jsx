import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useCart } from '../context/CartContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Storefront() {
    const { slug } = useParams()
    const [store, setStore] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { addToCart, itemCount } = useCart()

    useEffect(() => {
        setLoading(true)
        setError(null)

        Promise.all([
            api.get(`/api/store/${slug}`),
            api.get(`/api/store/${slug}/products?limit=500`),  // ← fetch all
        ])
            .then(([storeRes, productsRes]) => {
                setStore(storeRes.data)
                setProducts(productsRes.data)
            })
            .catch((err) => {
                setError(err.response?.data?.detail || 'Failed to load store')
            })
            .finally(() => setLoading(false))
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading store…</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Store not found</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link to="/" className="text-blue-600 hover:underline">← Back home</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <Link to="/" className="text-sm text-gray-500 hover:underline">
                            ← All stores
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">
                            {store.store_name}
                        </h1>
                    </div>
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
                {products.length === 0 ? (
                    <p className="text-gray-500">No products available yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
                            >
                                <Link to={`/store/${slug}/product/${product.id}`}>
                                    <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {product.image_url ? (
                                            <img
                                                src={`${API_URL}${product.image_url}`}    // ← FIX
                                                alt={product.name}
                                                className="h-full w-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none' }}
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-sm">No image</span>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-4 flex-1 flex flex-col">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                                        {product.category}
                                    </p>
                                    <Link
                                        to={`/store/${slug}/product/${product.id}`}
                                        className="font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2"
                                    >
                                        {product.name}
                                    </Link>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-900">
                                            ${Number(product.price_usd).toFixed(2)}
                                        </span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock_quantity === 0}
                                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                        >
                                            {product.stock_quantity === 0 ? 'Out' : 'Add'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}