import { Link } from 'react-router-dom'

export default function About() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center mb-14">
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
                    About Retail SaaS
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    A modern way to run an online store — built for merchants who want
                    a simple storefront, smart inventory tools, and AI-powered insights.
                </p>
            </div>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">
                        🏪
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">For merchants</h2>
                </div>
                <p className="text-slate-600 mb-6">
                    Launch your own online store in minutes — no technical skills required.
                </p>
                <ul className="space-y-3">
                    {[
                        'Get your own storefront at a unique URL',
                        'Add and manage products with images',
                        'Track inventory and get low-stock alerts',
                        'See AI-powered demand forecasts to know what to restock',
                        'Accept payments securely with Stripe',
                        'View incoming orders and update their status',
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                ✓
                            </span>
                            <span className="text-slate-700">{item}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xl">
                        🛍️
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">For customers</h2>
                </div>
                <p className="text-slate-600 mb-6">
                    Shop from any store on the platform with a smooth, familiar checkout.
                </p>
                <ul className="space-y-3">
                    {[
                        'Browse stores and discover products',
                        'Add items to your cart and adjust quantities',
                        'Sign in once, shop across any store',
                        'Checkout securely with Stripe',
                        'Get instant order confirmation',
                    ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                ✓
                            </span>
                            <span className="text-slate-700">{item}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-8 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xl">
                        ✨
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Smart demand forecasting</h2>
                </div>
                <p className="text-slate-700 mb-4">
                    Stop guessing how much to order. Our AI analyzes your sales history
                    and predicts how many units of each product will sell in the next 7 days.
                </p>
                <p className="text-slate-700">
                    Merchants see forecasts right on their dashboard — like{' '}
                    <span className="inline-block bg-white px-2 py-1 rounded text-sm font-mono text-blue-700">
                        "Aneri Kurta: 36 units next week"
                    </span>{' '}
                    — so they can restock at the right time, avoid stockouts, and reduce
                    overstock waste.
                </p>
            </section>

            <section className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Try it out</h2>
                <p className="text-slate-600 mb-6">
                    Browse the demo store or sign in as a merchant to explore the dashboard.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/store/paytest"
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                        Visit Demo Store
                    </Link>
                    <Link
                        to="/merchant/login"
                        className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                    >
                        Merchant Dashboard
                    </Link>
                </div>
            </section>
        </div>
    )
}