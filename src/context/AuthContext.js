'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        const token = localStorage.getItem("accessToken");
        console.log("CheckUser: Token from storage:", token);
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // using apiClient here to send token if it exists
            const res = await apiClient('/api/v1/users/current-user');
            console.log("CheckUser: API Response status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("CheckUser: User data fetched:", data.data);
                // Backend returns { data: { user: ... } } or { data: ... }
                // Based on logs, it returns { user: ... } inside data.data
                const userData = data.data.user || data.data;
                setUser(userData);
            } else {
                console.log("CheckUser: API failed, clearing user");
                setUser(null);
                // Optional: clear invalid token
                // localStorage.removeItem("accessToken"); 
            }
        } catch (error) {
            console.error('Auth check failed', error);
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
