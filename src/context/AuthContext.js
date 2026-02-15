'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            console.log("AuthContext: Checking user with token:", token);
            if (!token) {
                setLoading(false);
                return;
            }

            // using apiClient here to send token if it exists
            const res = await apiClient('/api/v1/users/current-user');
            console.log("AuthContext: checkUser response status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("AuthContext: User data fetched:", data.data);
                setUser(data.data);
            } else {
                console.log("AuthContext: Fetch failed, clearing user");
                setUser(null);
                // Optional: clear invalid token
                // localStorage.removeItem("accessToken"); 
            }
        } catch (error) {
            console.error('AuthContext: Auth check failed', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    const login = (userData, accessToken) => {
        console.log("auth context setting user ", userData);

        setUser(userData);

        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
        }
    };

    const logout = async () => {
        try {
            await apiClient('/api/v1/users/logout', { method: 'POST' });
            setUser(null);
            localStorage.removeItem("accessToken");
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
