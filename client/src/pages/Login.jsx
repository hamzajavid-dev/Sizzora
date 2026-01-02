import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            navigate(location.state?.from || '/account');
        }
    }, [user, navigate, location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (!res.success) {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/20 backdrop-blur-sm p-8 rounded-2xl border border-secondary/30 w-full max-w-md shadow-2xl"
            >
                <h2 className="text-3xl font-bold text-accent mb-6 text-center">Welcome Back</h2>
                {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-stone-800 border border-secondary/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-stone-800 border border-secondary/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-accent hover:bg-yellow-500 text-stone-900 font-bold py-3 rounded-lg transition-colors mt-2"
                    >
                        Log In
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-accent hover:underline">Sign Up</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
