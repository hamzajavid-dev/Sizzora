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
        <div className="min-h-screen pt-20 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/20 backdrop-blur-sm p-8 rounded-2xl border border-secondary/30 w-full max-w-md shadow-2xl"
            >
                <h2 className="text-3xl font-bold text-accent mb-6 text-center">Create Account</h2>
                {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full bg-stone-800 border border-secondary/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full bg-stone-800 border border-secondary/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            className="w-full bg-stone-800 border border-secondary/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full bg-stone-800 border border-secondary/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-accent hover:bg-yellow-500 text-stone-900 font-bold py-3 rounded-lg transition-colors mt-2"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent hover:underline">Log In</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Signup;
