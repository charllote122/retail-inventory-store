import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const merchantClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
})

merchantClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('merchant_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

merchantClient.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('merchant_token')
        }
        return Promise.reject(err)
    }
)

export default merchantClient
