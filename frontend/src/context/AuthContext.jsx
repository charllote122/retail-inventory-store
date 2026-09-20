import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [customer, setCustomer] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token) {
            setCustomer(null)
            setLoading(false)
            return
        }

        api.get('/api/customers/me')
            .then((res) => setCustomer(res.data))
            .catch(() => {
                localStorage.removeItem('token')
                setToken(null)
                setCustomer(null)
            })
            .finally(() => setLoading(false))
    }, [token])

    const login = async (email, password) => {
        const res = await api.post('/api/customers/login', { email, password })
        localStorage.setItem('token', res.data.access_token)
        setToken(res.data.access_token)
    }

    const register = async (payload) => {
        const res = await api.post('/api/customers/register', payload)
        localStorage.setItem('token', res.data.access_token)
        setToken(res.data.access_token)
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setCustomer(null)
    }

    return (
        <AuthContext.Provider
            value={{ token, customer, loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}