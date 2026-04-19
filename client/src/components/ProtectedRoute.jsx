import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
    const { user, loading } = useAuth();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!loading) {
            setIsChecking(false);
        }
    }, [loading]);

    if (loading || isChecking) {
        return <div className="text-white text-center pt-20">Loading...</div>; // Or a spinner
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
