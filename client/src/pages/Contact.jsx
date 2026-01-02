import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaLightbulb, FaExclamationTriangle } from 'react-icons/fa';

const Contact = () => {
    return (
        <div className="min-h-screen bg-stone-900 text-white pt-24 pb-16">
            {/* Hero Section with Image */}
            <div className="relative">
                <div className="w-full h-64 md:h-80 overflow-hidden">
                    <img
                        src="https://www.mcdonalds.com.pk/wp-content/uploads/2022/08/Contact-Us.png"
                        alt="Contact Us"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-transparent"></div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Contact Us</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        We value your feedback! Whether you have a suggestion to improve our service or a complaint to share, we're here to listen.
                    </p>
                </motion.div>

                {/* Two Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Suggestions Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Link to="/contact/suggestions">
                            <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl p-8 border border-stone-700/50 hover:border-primary/50 transition-all duration-300 group cursor-pointer h-full">
                                <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <FaLightbulb className="text-dark text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">Suggestions</h2>
                                <p className="text-gray-400 mb-6">
                                    Have an idea to make Sizzora even better? Share your suggestions with us and help us improve!
                                </p>
                                <span className="text-secondary font-semibold group-hover:tracking-wider transition-all inline-flex items-center gap-2">
                                    Share Your Ideas →
                                </span>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Complaints Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <Link to="/contact/complaints">
                            <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl p-8 border border-stone-700/50 hover:border-accent/50 transition-all duration-300 group cursor-pointer h-full">
                                <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <FaExclamationTriangle className="text-white text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold mb-3 group-hover:text-secondary transition-colors">Complaints</h2>
                                <p className="text-gray-400 mb-6">
                                    Had a bad experience? Let us know and we'll work to make things right for you.
                                </p>
                                <span className="text-accent font-semibold group-hover:tracking-wider transition-all inline-flex items-center gap-2">
                                    Report an Issue →
                                </span>
                            </div>
                        </Link>
                    </motion.div>
                </div>

                {/* Contact Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center mt-16"
                >
                    <p className="text-gray-500">
                        Need immediate help? Call us at <span className="text-primary font-semibold">+1 234 567 890</span> or email <span className="text-primary font-semibold">support@sizzora.com</span>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
