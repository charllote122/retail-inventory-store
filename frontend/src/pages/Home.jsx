import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function Home() {
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/store')
            .then((res) => setStores(res.data))
            .catch(() => setStores([]))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            {/* Hero */}
            <section className="bg-gradient-to-br from-slate-900 to-slate-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                        Retail SaaS
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                        Multi-tenant e-commerce platform with AI-powered demand forecasting.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/merchant/login"
                            className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition"
                        >
                            Start selling →
                        </Link>
                        <Link
                            to="/about"
                            className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-slate-900 transition"
                        >
                            Learn more
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stores directory */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                        Browse stores
                    </h2>
                    <p className="text-slate-600">
                        {loading ? 'Loading…' : `${stores.length} active ${stores.length === 1 ? 'store' : 'stores'} on the platform`}
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                                <div className="w-14 h-14 bg-slate-200 rounded-lg mb-4"></div>
                                <div className="h-5 bg-slate-200 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                            </div>
                        ))}
                    </div>
                ) : stores.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <p className="text-slate-600 mb-4">No stores yet.</p>
                        <Link to="/merchant/login" className="text-blue-600 hover:underline font-medium">
                            Be the first to open one →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map((store) => (
                            <Link
                                key={store.store_slug}
                                to={`/store/${store.store_slug}`}
                                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition p-6 block group"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4 group-hover:scale-105 transition">
                                    {store.store_name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                    {store.store_name}
                                </h3>
                                <p className="text-sm text-slate-500 mb-3">/store/{store.store_slug}</p>
                                <p className="text-blue-600 text-sm font-medium">
                                    Visit store →
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}