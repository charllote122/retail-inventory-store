export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-xl px-6">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Retail SaaS
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Multi-tenant e-commerce platform with AI demand forecasting.
                </p>
                <div className="flex gap-4 justify-center">
                    <a
                        href="/store/novatech-store"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Visit NovaTech Store
                    </a>
                    <a
                        href="/store/urbanthreads"
                        className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
                    >
                        Visit UrbanThreads
                    </a>
                </div>
            </div>
        </div>
    )
}