import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MerchantAuthProvider } from './context/MerchantAuthContext'
import { CartProvider } from './context/CartContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MerchantAuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </MerchantAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)