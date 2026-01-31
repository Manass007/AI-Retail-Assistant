import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../api/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const authContext = useAuth();
  const isAuthenticated = authContext?.isAuthenticated || false;

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartCount(0);
      setTotalAmount(0);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      if (response.success) {
        setCartItems(response.cart || []);
        setCartCount(response.total_items || 0);
        setTotalAmount(response.total_amount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Don't crash on cart fetch errors
      setCartItems([]);
      setCartCount(0);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await cartAPI.addToCart(productId, quantity);
      if (response.success) {
        await fetchCart();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to add to cart' };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const response = await cartAPI.updateCartItem(productId, quantity);
      if (response.success) {
        await fetchCart();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to update cart' };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await cartAPI.removeFromCart(productId);
      if (response.success) {
        await fetchCart();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to remove from cart' };
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartAPI.clearCart();
      if (response.success) {
        setCartItems([]);
        setCartCount(0);
        setTotalAmount(0);
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to clear cart' };
    }
  };

  const value = {
    cartItems,
    cartCount,
    totalAmount,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
