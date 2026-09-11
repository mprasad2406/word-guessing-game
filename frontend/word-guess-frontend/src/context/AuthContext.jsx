import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { authService } from "../services/authService";
import { storage } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => storage.getToken());
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Logout action. Clears local storage and in-memory auth state.
   */
  const logout = useCallback(() => {
    storage.clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  /**
   * Restore user session from backend on initial mount if token is found.
   */
  const restoreSession = useCallback(async () => {
    const existingToken = storage.getToken();
    const existingRefreshToken = storage.getRefreshToken();
    if (!existingToken && !existingRefreshToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const userProfile = await authService.getCurrentUser();
      setUser(userProfile);
      setToken(storage.getToken() || existingToken);
    } catch (error) {
      console.warn("Session restoration failed (token invalid or expired):", error.message);
      storage.clearAuth();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Listen to global session expiration & account blocked events
  useEffect(() => {
    const handleSessionExpiredEvent = (e) => {
      const msg = e.detail?.message || "Your session has expired. Please sign in again.";
      toast.warn(msg, { toastId: "session-expired" });
      logout();
    };

    const handleAccountBlockedEvent = (e) => {
      const msg = e.detail?.message || "Account is blocked. Please contact the administrator.";
      toast.error(msg, { toastId: "account-blocked" });
      logout();
    };

    window.addEventListener("auth:session-expired", handleSessionExpiredEvent);
    window.addEventListener("auth:account-blocked", handleAccountBlockedEvent);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpiredEvent);
      window.removeEventListener("auth:account-blocked", handleAccountBlockedEvent);
    };
  }, [logout]);

  /**
   * Login action.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<any>} Authenticated user object
   */
  const login = async (username, password) => {
    const data = await authService.login(username, password);
    const { access_token, refresh_token, user: loggedInUser } = data;

    storage.setTokens(access_token, refresh_token);
    setToken(access_token);
    setUser(loggedInUser);

    return loggedInUser;
  };

  /**
   * Register action. Registers a new account and automatically logs the user in.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<any>}
   */
  const register = async (username, password) => {
    await authService.register(username, password);
    return await login(username, password);
  };


  /**
   * Manually refresh the authenticated user's profile from the backend.
   */
  const refreshUser = async () => {
    if (!token) return null;
    try {
      const userProfile = await authService.getCurrentUser();
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
