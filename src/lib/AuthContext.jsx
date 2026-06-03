/* eslint-disable react/prop-types */
import React, { createContext, useState, useContext, useEffect, useMemo } from "react";
import { ApiError, authApi } from "@/lib/api";

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
    // Em modo backend real, o registro público foi desativado por regra de negócio.
    if (import.meta.env.VITE_API_URL) {
      throw new Error("Registro público não permitido. Usuários devem ser criados por administradores via rota privada /usuarios.");
    }
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

  const buildSessionFromBackend = (response, fallbackEmail) => {
    const responseData = response?.data ?? response?.user ?? response?.usuario ?? response;
    const token =
      response?.token ||
      response?.access_token ||
      response?.accessToken ||
      response?.auth_token ||
      responseData?.token ||
      responseData?.access_token ||
      responseData?.accessToken ||
      responseData?.auth_token ||
      null;

    const userSource = responseData && typeof responseData === "object" ? responseData : {};
    const email = userSource.email || fallbackEmail;

    return {
      id: userSource.id || userSource.user_id || userSource.usuario_id || email || `user_${Date.now()}`,
      name: userSource.name || userSource.nome || userSource.usuario || userSource.username || email || "Usuário",
      email,
      cargo: (userSource.cargo || userSource.role || userSource.perfil || null)?.toString().toLowerCase() || null,
      token,
      raw: response,
    };
  };

  const classifyLoginError = (error) => {
    if (error instanceof ApiError) {
      if (error.status === 400) return { type: "invalid_payload", message: error.message };
      if (error.status === 401) return { type: "invalid_credentials", message: error.message };
      if (error.status === 403) return { type: "access_denied", message: error.message };
      if (error.status === 404) return { type: "route_not_found", message: error.message };
      if (error.status === 422) return { type: "validation_error", message: error.message };
      return { type: "login_failed", message: error.message };
    }

    return { type: "login_failed", message: error?.message || "Não foi possível realizar o login." };
  };

  const login = async ({ email, senha, password } = {}) => {
    // aceitar `senha` (preferido) ou `password` no payload vindo do formulário
    const passwordToUse = senha ?? password;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (import.meta.env.VITE_API_URL) {
      try {
        const response = await authApi.login({
          email: normalizedEmail,
          senha: passwordToUse,
        });

        const sessionUser = buildSessionFromBackend(response, normalizedEmail);

        setStoredSession(sessionUser);
        setUser(sessionUser);
        setIsAuthenticated(true);
        setAuthError(null);
        return sessionUser;
      } catch (err) {
        const loginError = classifyLoginError(err);
        setAuthError(loginError);
        throw new Error(loginError.message);
      }
    }

    // Fallback local
    const users = getStoredUsers();
    const foundUser = users.find(
      (item) => item.email.toLowerCase() === normalizedEmail && item.password === passwordToUse
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
