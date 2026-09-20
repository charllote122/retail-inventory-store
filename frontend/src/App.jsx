import { Routes, Route, Navigate } from 'react-router-dom'
import Storefront from './pages/Storefront'
import Home from './pages/Home'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Success from './pages/Success'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/success" element={<Success />} />
      <Route path="/store/:slug" element={<Storefront />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}