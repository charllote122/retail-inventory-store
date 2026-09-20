import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
            <div className="text-center max-w-md">
                <div className="text-7xl font-bold text-slate-900 mb-4">404</div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
                <p className="text-slate-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/"
                        className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition"
                    >
                        Back to home
                    </Link>
                    <Link
                        to="/store/paytest"
                        className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                    >
                        Visit demo store
                    </Link>
                </div>
            </div>
        </div>
    )
}