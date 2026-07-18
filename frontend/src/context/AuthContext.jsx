import { createContext, useEffect, useState } from "react";
import API from "../services/api";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // ================= GET PROFILE =================

  const getProfile = async () => {
    try {
      const { data } = await API.get("/auth/profile");

      setUser(data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      getProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // ================= LOGIN =================

  const login = async (formData) => {
    const { data } = await API.post(
      "/auth/login",
      formData
    );

    localStorage.setItem(
      "token",
      data.token
    );

    setUser(data.user);

    return data;
  };

  // ================= REGISTER =================

  const register = async (formData) => {
    const { data } = await API.post(
      "/auth/register",
      formData
    );

    return data;
  };

  // ================= LOGOUT =================

  const logout = () => {
    localStorage.removeItem("token");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;