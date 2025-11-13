import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "../lib/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  const clearSession = useCallback(() => {
    console.log("🚪 Clearing session");
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const fetchProfile = useCallback(
    async (activeToken) => {
      try {
        console.log("👤 Fetching profile with token:", activeToken ? "Yes" : "No");
        
        const response = await apiRequest("/api/auth/me", { 
          token: activeToken 
        });
        
        const profile = response?.data?.user;
        
        if (profile) {
          console.log("✅ Profile loaded:", profile.email);
          setUser(profile);
        } else {
          console.warn("⚠️ No profile data in response");
          clearSession();
        }
      } catch (error) {
        console.error("❌ Failed to load profile:", error.message);
        clearSession();
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearSession]
  );

  // Listen for unauthorized events (from apiClient)
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn("⚠️ Unauthorized event received, clearing session");
      clearSession();
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, [clearSession]);

  // Load user profile on mount if token exists
  useEffect(() => {
    if (!token) {
      console.log("ℹ️ No token found, skipping profile fetch");
      setLoading(false);
      return;
    }

    console.log("🔄 Token found, fetching profile");
    fetchProfile(token).catch(() => {
      // fetchProfile already clears the session on error
    });
  }, [token, fetchProfile]);

  const handleAuthSuccess = (payload) => {
    const authToken = payload?.data?.token;
    const profile = payload?.data?.user;

    console.log("🔐 Auth success handler:", {
      hasToken: !!authToken,
      hasProfile: !!profile,
      email: profile?.email,
    });

    if (!authToken || !profile) {
      throw new Error("Malformed authentication response");
    }

    localStorage.setItem("token", authToken);
    setToken(authToken);
    setUser(profile);
    
    console.log("✅ Token saved to localStorage and state updated");
    return profile;
  };

  const login = async ({ email, password }) => {
    setAuthenticating(true);
    try {
      console.log("🔑 Attempting login for:", email);
      
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
        token: null, // Don't send token for login
      });
      
      return handleAuthSuccess(response);
    } catch (error) {
      console.error("❌ Login failed:", error.message);
      throw error;
    } finally {
      setAuthenticating(false);
    }
  };

  const register = async ({ name, email, password }) => {
    setAuthenticating(true);
    try {
      console.log("📝 Attempting registration for:", email);
      
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
        token: null, // Don't send token for registration
      });
      
      return handleAuthSuccess(response);
    } catch (error) {
      console.error("❌ Registration failed:", error.message);
      throw error;
    } finally {
      setAuthenticating(false);
    }
  };

  const logout = () => {
    console.log("👋 Logging out");
    clearSession();
  };

  const refreshProfile = async () => {
    if (!token) {
      console.warn("⚠️ Cannot refresh profile: no token");
      return null;
    }
    
    console.log("🔄 Refreshing profile");
    setLoading(true);
    await fetchProfile(token);
    return user;
  };

  const value = {
    user,
    token,
    loading,
    authenticating,
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};