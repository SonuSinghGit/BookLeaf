import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("bookleaf_admin_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem("bookleaf_admin_token");
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user && res.user.role === "admin") {
            setUser(res.user);
          } else {
            logout(false);
          }
        } catch (err) {
          logout(false);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.success && res.token) {
      if (res.user.role !== "admin") {
        throw new Error("Access restricted to BookLeaf Operations Admins only.");
      }
      queryClient.clear();
      localStorage.setItem("bookleaf_admin_token", res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || "Admin login failed");
  };

  const logout = (showToast = true) => {
    queryClient.clear();
    localStorage.removeItem("bookleaf_admin_token");
    setToken(null);
    setUser(null);
    if (showToast) {
      toast.success("Signed out successfully");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user && user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

