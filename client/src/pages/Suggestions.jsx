import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaLightbulb, FaArrowLeft, FaImage, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const Suggestions = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/feedback', {
                type: 'suggestion',
                ...formData,
                image
            });
            setSuccess(true);
            setTimeout(() => navigate('/contact'), 2000);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to submit suggestion. Please try again.';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-stone-900 text-white pt-24 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaLightbulb className="text-dark text-3xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary mb-2">Thank You!</h2>
                    <p className="text-gray-400">Your suggestion has been submitted successfully.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-900 text-white pt-24 pb-16 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <Link to="/contact" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8">
                    <FaArrowLeft /> Back to Contact
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                            <FaLightbulb className="text-dark text-xl" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Share Your Suggestion</h1>
                            <p className="text-gray-400">Help us improve with your valuable ideas</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-stone-800/60 backdrop-blur-sm rounded-2xl p-8 border border-stone-700/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-stone-700 border border-stone-600 rounded-lg p-3 text-white focus:border-primary outline-none transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-stone-700 border border-stone-600 rounded-lg p-3 text-white focus:border-primary outline-none transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full bg-stone-700 border border-stone-600 rounded-lg p-3 text-white focus:border-primary outline-none transition-colors"
                                placeholder="+1 234 567 890"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Your Suggestion *</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="5"
                                className="w-full bg-stone-700 border border-stone-600 rounded-lg p-3 text-white focus:border-primary outline-none transition-colors resize-none"
                                placeholder="Share your idea to help us improve..."
                            ></textarea>
                        </div>

                        {/* Image Upload */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Attach Image (Optional)</label>
                            {imagePreview ? (
                                <div className="relative inline-block">
                                    <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg border border-stone-600" />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 bg-stone-700 border-2 border-dashed border-stone-600 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                                    <FaImage className="text-gray-500" />
                                    <span className="text-gray-400">Click to upload an image</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-dark font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Suggestion'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default Suggestions;
