/* eslint-disable react/prop-types */
import React, { createContext, useState, useContext, useEffect, useMemo } from "react";
import { authApi, setAuthToken } from "@/lib/api";

const AuthContext = createContext();
const AUTH_USERS_KEY = "fleetsense_auth_users";
const AUTH_SESSION_KEY = "fleetsense_auth_session";

const hasBackend = Boolean(import.meta.env.VITE_API_URL);

function normalizeEmail(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

function normalizeName(value) {
  return `${value ?? ""}`.trim() || "Usuário";
}

function normalizeUserRecord(user = {}) {
  const id = user.idUsuario ?? user.usuarioId ?? user.user_id ?? user.id ?? user._id ?? null;

  return {
    id: id != null ? `${id}` : `user_${Date.now()}`,
    name: normalizeName(user.nome ?? user.name ?? user.usuario),
    email: normalizeEmail(user.email),
    password: `${user.senha ?? user.password ?? ""}`,
  };
}

function toSessionUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

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

  const register = async ({ name, email, password, matricula, cargo }) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = normalizeName(name);

    if (!normalizedName || !normalizedEmail || !password || !matricula || !cargo) {
      throw new Error("Preencha todos os campos obrigatórios.");
    }

    if (hasBackend) {
      const createdUser = await authApi.createUser({
        nome: normalizedName,
        email: normalizedEmail,
        senha: password,
        matricula,
        cargo,
      });

      const normalizedUser = normalizeUserRecord(
        createdUser || { nome: normalizedName, email: normalizedEmail, senha: password, matricula, cargo }
      );
      const sessionUser = toSessionUser(normalizedUser);

      setStoredSession(sessionUser);
      setUser(sessionUser);
      setIsAuthenticated(true);
      setAuthError(null);
      return sessionUser;
    }

    const users = getStoredUsers();
    const alreadyExists = users.some((item) => normalizeEmail(item.email) === normalizedEmail);

    if (alreadyExists) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: normalizedName,
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

  const login = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);

    if (hasBackend) {
      try {
        const response = await authApi.login(normalizedEmail, password);

        // Tenta extrair token em formatos comuns
        const token =
          response?.token || response?.access_token || response?.auth_token || response?.accessToken || response?.data?.token;
        if (token) setAuthToken(token);

        // Extrai o objeto de usuário em formatos comuns
        const userPayload = response?.user || response?.usuario || response?.data || response;
        const normalizedUser = normalizeUserRecord(userPayload || { email: normalizedEmail });

        const sessionUser = toSessionUser(normalizedUser);
        setStoredSession(sessionUser);
        setUser(sessionUser);
        setIsAuthenticated(true);
        setAuthError(null);
        return sessionUser;
      } catch (err) {
        console.error("❌ Erro no login:", err.message);
        throw err;
      }
    }

    const users = getStoredUsers();
    const foundUser = users.find(
      (item) => normalizeEmail(item.email) === normalizedEmail && item.password === password
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
    setAuthToken(null);
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
