import { Link } from 'react-router-dom'

export default function Footer() {
    const year = new Date().getFullYear()

    return (
        <footer className="bg-slate-900 text-slate-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="sm:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                                R
                            </div>
                            <span className="text-lg font-bold text-white">Retail SaaS</span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-md">
                            A simple way to launch and run an online store — with smart
                            inventory tools and AI-powered insights that help you sell more
                            and waste less.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Shop</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-white transition">Browse stores</Link></li>
                            <li><Link to="/store/paytest" className="hover:text-white transition">Demo store</Link></li>
                            <li><Link to="/cart" className="hover:text-white transition">Your cart</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">For merchants</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/merchant/login" className="hover:text-white transition">Open your store</Link></li>
                            <li><Link to="/about" className="hover:text-white transition">Learn more</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-400">© {year} Retail SaaS</p>
                    <p className="text-sm text-slate-500">Made with care for small businesses</p>
                </div>
            </div>
        </footer>
    )
}