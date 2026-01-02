import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await axios.post('/api/subscribers', { email });
            setStatus('success');
            setMessage(res.data.message);
            setEmail('');
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.error || 'Something went wrong. Please try again.');
        }
    };

    return (
        <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tomato via-gold to-tomato"></div>

            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        <span className="text-gold">Exclusive</span> Offers & News
                    </h2>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                        Join our exclusive community! Get special discounts, secret menu items, and the latest news delivered straight to your inbox.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-6 py-3 rounded-full bg-gray-700 border border-gray-600 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-white placeholder-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full md:w-auto px-8 py-3 rounded-full bg-tomato hover:bg-red-600 text-white font-bold transition-all disabled:opacity-70 shadow-lg shadow-tomato/30 whitespace-nowrap"
                        >
                            {status === 'loading' ? 'Joining...' : 'Subscribe Now'}
                        </button>
                    </form>

                    {message && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 text-lg font-medium ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}
                        >
                            {message}
                        </motion.p>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default Newsletter;
