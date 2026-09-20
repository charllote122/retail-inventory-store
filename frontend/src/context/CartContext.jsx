import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('cart')
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items))
    }, [items])

    const addToCart = (product, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product_id === product.id)
            if (existing) {
                return prev.map((i) =>
                    i.product_id === product.id
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                )
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    price_usd: Number(product.price_usd),
                    quantity,
                    merchant_id: product.merchant_id ?? null,
                },
            ]
        })
    }

    const removeFromCart = (productId) => {
        setItems((prev) => prev.filter((i) => i.product_id !== productId))
    }

    const clearCart = () => setItems([])

    const total = items.reduce((sum, i) => sum + i.price_usd * i.quantity, 0)
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, clearCart, total, itemCount }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be used inside CartProvider')
    return ctx
}