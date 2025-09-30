import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // npm install jwt-decode

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // 토큰 만료 시간 체크
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser);
        } else {
          // 토큰 만료 시
          localStorage.removeItem("authToken");
          setToken(null);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("authToken");
        setToken(null);
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("authToken", newToken);
    setToken(newToken);
    const decodedUser = jwtDecode(newToken);
    setUser(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  const value = { user, token, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
