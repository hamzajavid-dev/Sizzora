import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Persist login state on refresh & Setup Interceptors
    useEffect(() => {
        const checkUserLoggedIn = async () => {
            try {
                const res = await axios.get('/api/auth/me');
                setUser(res.data);
            } catch (error) {
                // Not logged in or expired
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkUserLoggedIn();

        // Axios Interceptor for Silent Refresh
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                // Avoid infinite loop if refresh itself fails
                if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/refresh') {
                    originalRequest._retry = true;
                    try {
                        await axios.post('/api/auth/refresh');
                        // Retry original request
                        return axios(originalRequest);
                    } catch (err) {
                        // Refresh failed - logout user
                        setUser(null);
                        return Promise.reject(err);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/login', { identifier: email, password });
            // Token is set in cookie by server
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const signup = async (data) => {
        try {
            const res = await axios.post('/api/auth/register', data);
            // Token is set in cookie by server
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Signup failed' };
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
