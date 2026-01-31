import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi, getToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.me();
      setUser(data?.user ?? null);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(
    async (email, otp) => {
      const data = await authApi.verifyOtp(email, otp);
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user ?? null);
        return { needsRegister: data.isNewUser && !data.user?.name };
      }
      return {};
    },
    []
  );

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    if (data.token) {
      localStorage.setItem("token", data.token);
      setUser(data.user ?? null);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isLoggedIn: !!user,
    login,
    register,
    logout,
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
