import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Storefront from './pages/Storefront'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Success from './pages/Success'
import NotFound from './pages/NotFound'
import MerchantLogin from './pages/MerchantLogin'
import MerchantDashboard from './pages/MerchantDashboard'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/store/:slug" element={<Storefront />} />
        <Route path="/store/:slug/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/success" element={<Success />} />
        <Route path="/404" element={<NotFound />} />
      </Route>

      <Route path="/merchant/login" element={<MerchantLogin />} />
      <Route path="/dashboard" element={<MerchantDashboard />} />

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}