import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useMerchantAuth } from '../context/MerchantAuthContext'

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false)
    const { itemCount } = useCart()
    const { customer, logout: logoutCustomer } = useAuth()
    const { merchant, logout: logoutMerchant } = useMerchantAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        if (merchant) logoutMerchant()
        if (customer) logoutCustomer()
        setMenuOpen(false)
        navigate('/')
    }

    const linkClass = ({ isActive }) =>
        `px-3 py-2 rounded-lg text-sm font-medium transition ${isActive
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            R
                        </div>
                        <span className="text-lg font-bold text-slate-900 hidden sm:block">
                            Retail SaaS
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink to="/" end className={linkClass}>Stores</NavLink>
                        <NavLink to="/about" className={linkClass}>About</NavLink>
                        {merchant && (
                            <NavLink to="/dashboard" className={linkClass}>My Dashboard</NavLink>
                        )}
                    </nav>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/cart"
                            className="relative px-3 py-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        {customer || merchant ? (
                            <button
                                onClick={handleLogout}
                                className="hidden sm:block px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
                            >
                                Sign out
                            </button>
                        ) : (
                            <Link
                                to="/merchant/login"
                                className="hidden sm:block px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
                            >
                                Start selling
                            </Link>
                        )}

                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
                            aria-label="Menu"
                        >
                            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {menuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
                        <NavLink to="/" end className={linkClass} onClick={() => setMenuOpen(false)}>Stores</NavLink>
                        <NavLink to="/about" className={linkClass} onClick={() => setMenuOpen(false)}>About</NavLink>
                        {merchant && (
                            <NavLink to="/dashboard" className={linkClass} onClick={() => setMenuOpen(false)}>My Dashboard</NavLink>
                        )}
                        {!customer && !merchant && (
                            <NavLink to="/merchant/login" className={linkClass} onClick={() => setMenuOpen(false)}>Start selling</NavLink>
                        )}
                        {(customer || merchant) && (
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                            >
                                Sign out
                            </button>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}