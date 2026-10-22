import Layout from './components/layout/Layout';
import ToastContainer from './components/ui/ToastContainer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import HomePage from './pages/HomePage'; import ProductsPage from './pages/ProductsPage'; import ProductDetailPage from './pages/ProductDetailPage'; import ServicesPage from './pages/ServicesPage'; import CartPage from './pages/CartPage'; import CheckoutPage from './pages/CheckoutPage'; import LoginPage from './pages/LoginPage'; import RegisterPage from './pages/RegisterPage'; import ProfilePage from './pages/ProfilePage'; import AdminPage from './pages/AdminPage'; import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  useSessionRefresh();
  return (
    <ErrorBoundary><Layout>
      <ScrollToTop /><ToastContainer />
      <Routes><Route path="/" element={<HomePage />} /><Route path="/products" element={<ProductsPage />} /><Route path="/products/:slug" element={<ProductDetailPage />} /><Route path="/services" element={<ServicesPage />} /><Route path="/cart" element={<CartPage />} /><Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} /><Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} /><Route path="*" element={<NotFoundPage />} /></Routes>
    </Layout></ErrorBoundary>
  );
}
