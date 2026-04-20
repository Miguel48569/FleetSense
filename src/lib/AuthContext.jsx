/* eslint-disable react/prop-types */
import React, { createContext, useState, useContext, useEffect, useMemo } from "react";

const AuthContext = createContext();
const AUTH_USERS_KEY = "fleetsense_auth_users";
const AUTH_SESSION_KEY = "fleetsense_auth_session";

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function setStoredUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setStoredSession(user) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
}

function clearStoredSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = getStoredSession();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setAuthError({
        type: "auth_required",
        message: "Authentication required",
      });
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = ({ name, email, password }) => {
    const users = getStoredUsers();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const alreadyExists = users.some((item) => item.email.toLowerCase() === normalizedEmail);

    if (alreadyExists) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: name?.trim() || "Usuário",
      email: normalizedEmail,
      password,
      created_at: new Date().toISOString(),
    };

    setStoredUsers([...users, newUser]);

    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    };

    setStoredSession(sessionUser);
    setUser(sessionUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return sessionUser;
  };

  const login = ({ email, password }) => {
    const users = getStoredUsers();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const foundUser = users.find(
      (item) => item.email.toLowerCase() === normalizedEmail && item.password === password
    );

    if (!foundUser) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const sessionUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
    };

    setStoredSession(sessionUser);
    setUser(sessionUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    clearStoredSession();
  };

  const navigateToLogin = () => {
    // Redireciona para página de login genérica
    globalThis.location.href = "/login";
  };

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      register,
      logout,
      navigateToLogin,
      checkUserAuth,
    }),
    [user, isAuthenticated, isLoadingAuth, authError]
  );

  return (
    <AuthContext.Provider value={contextValue}>
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
