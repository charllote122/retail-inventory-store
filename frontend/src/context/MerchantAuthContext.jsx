import { createContext, useContext, useState, useEffect } from 'react'
import merchantClient from '../api/merchantClient'

const MerchantAuthContext = createContext(null)

export function MerchantAuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('merchant_token'))
    const [merchant, setMerchant] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token) {
            setMerchant(null)
            setLoading(false)
            return
        }

        merchantClient.get('/api/auth/me')
            .then((res) => setMerchant(res.data))
            .catch(() => {
                localStorage.removeItem('merchant_token')
                setToken(null)
                setMerchant(null)
            })
            .finally(() => setLoading(false))
    }, [token])

    const login = async (email, password) => {
        const res = await merchantClient.post('/api/auth/login', { email, password })
        localStorage.setItem('merchant_token', res.data.access_token)
        setToken(res.data.access_token)
    }

    const register = async (payload) => {
        const res = await merchantClient.post('/api/auth/register', payload)
        localStorage.setItem('merchant_token', res.data.access_token)
        setToken(res.data.access_token)
    }

    const logout = () => {
        localStorage.removeItem('merchant_token')
        setToken(null)
        setMerchant(null)
    }

    return (
        <MerchantAuthContext.Provider
            value={{ token, merchant, loading, login, register, logout }}
        >
            {children}
        </MerchantAuthContext.Provider>
    )
}

export function useMerchantAuth() {
    const ctx = useContext(MerchantAuthContext)
    if (!ctx) throw new Error('useMerchantAuth must be used inside MerchantAuthProvider')
    return ctx
}