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
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate(location.state?.from || '/account');
            }
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
                className="bg-stone-800/60 backdrop-blur-md p-8 rounded-2xl border-2 border-primary/20 w-full max-w-md shadow-[0_0_50px_rgba(254,183,5,0.1)]"
            >
                <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm">
                    WELCOME BACK
                </h2>
                {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-sm text-center font-bold">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-primary text-xs font-bold uppercase tracking-wider mb-2 drop-shadow-md">Email or Username</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-stone-900/80 border border-stone-700 rounded-lg px-4 py-3 text-white font-bold tracking-wide focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-300 shadow-inner"
                            placeholder="Enter your email or username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-primary text-xs font-bold uppercase tracking-wider mb-2 drop-shadow-md">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-stone-900/80 border border-stone-700 rounded-lg px-4 py-3 text-white font-bold tracking-wide focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-300 shadow-inner"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-stone-900 font-extrabold uppercase tracking-widest py-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(254,183,5,0.4)] mt-4"
                    >
                        Log In Now
                    </button>
                </form>

                <p className="mt-8 text-center text-gray-300 font-medium">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary font-bold hover:text-secondary transition-colors underline decoration-2 underline-offset-4">Sign Up Here</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
