import React from 'react';
import { Navigate } from 'react-router-dom';
import jsCookie from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = jsCookie.get('token');

    if (!token) {
        // If no token, redirect to homepage
        return <Navigate to="/" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        const userRole = decoded.role;

        if (allowedRoles && !allowedRoles.includes(userRole)) {
            // If user's role is not allowed, redirect to homepage
            // Or to a specific 'unauthorized' page in the future
            return <Navigate to="/" replace />;
        }

        return children;
    } catch (error) {
        // If token is invalid or expired, clear it and redirect
        console.error('Invalid token:', error);
        jsCookie.remove('token');
        return <Navigate to="/" replace />;
    }
};

export default ProtectedRoute;
