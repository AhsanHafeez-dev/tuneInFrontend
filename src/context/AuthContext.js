'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        try {
            // using apiClient here to send token if it exists
            const res = await apiClient('/api/v1/users/current-user');
            if (res.ok) {
                const data = await res.json();
                setUser(data.data);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            checkUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = (userData, accessToken) => {
        console.log("auth context setting user ",userData);
        
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
