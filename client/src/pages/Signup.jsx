import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const { signup, user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            navigate('/account');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await signup(formData);
        if (!res.success) {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-24 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-stone-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-white/10 w-full max-w-lg shadow-2xl relative z-10"
            >
                <div className="text-center mb-10">
                    <h2 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-secondary drop-shadow-sm tracking-tight">
                        JOIN THE ELITE
                    </h2>
                    <p className="text-gray-400 font-medium">Create your account and start your journey</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-sm text-center font-bold flex items-center justify-center gap-2"
                    >
                        <span>⚠️</span> {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full bg-stone-800/50 border border-stone-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 hover:bg-stone-800"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full bg-stone-800/50 border border-stone-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 hover:bg-stone-800"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            className="w-full bg-stone-800/50 border border-stone-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 hover:bg-stone-800"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full bg-stone-800/50 border border-stone-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 hover:bg-stone-800"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <p className="text-[10px] text-gray-500 ml-1">Must be at least 8 chars, incl. 1 number & 1 uppercase.</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-stone-900 font-extrabold text-lg uppercase tracking-widest py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-primary/20 mt-4 active:scale-95"
                    >
                        Create Account
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-bold hover:text-white transition-colors">
                            Log In Here
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
