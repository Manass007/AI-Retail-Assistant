import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import theme from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <Router>
              <ErrorBoundary>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                  <ErrorBoundary>
                    <Header />
                  </ErrorBoundary>
                  <main style={{ flexGrow: 1 }}>
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/onboarding" element={<OnboardingPage />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/products/:id" element={<ProductDetailPage />} />
                        <Route
                          path="/cart"
                          element={
                            <ProtectedRoute>
                              <CartPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/checkout"
                          element={
                            <ProtectedRoute>
                              <CheckoutPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <ProfilePage />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/404" element={<NotFoundPage />} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                      </Routes>
                    </ErrorBoundary>
                  </main>
                  <ErrorBoundary>
                    <Footer />
                  </ErrorBoundary>
                </div>
              </ErrorBoundary>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </Router>
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
