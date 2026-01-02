import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTwitter, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-stone-950 text-white border-t border-primary/20">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4">
                            SIZZORA
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-md">
                            Experience the finest culinary delights delivered right to your doorstep.
                            Fresh ingredients, passionate chefs, unforgettable flavors.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="bg-stone-800 hover:bg-primary hover:text-dark p-3 rounded-full transition-all duration-300">
                                <FaFacebookF size={18} />
                            </a>
                            <a href="#" className="bg-stone-800 hover:bg-primary hover:text-dark p-3 rounded-full transition-all duration-300">
                                <FaInstagram size={18} />
                            </a>
                            <a href="#" className="bg-stone-800 hover:bg-primary hover:text-dark p-3 rounded-full transition-all duration-300">
                                <FaTwitter size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-4 text-primary">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-gray-400 hover:text-primary transition-colors">Home</Link></li>
                            <li><Link to="/menu" className="text-gray-400 hover:text-primary transition-colors">Menu</Link></li>
                            <li><Link to="/about" className="text-gray-400 hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="text-gray-400 hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-bold mb-4 text-primary">Contact Us</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-400">
                                <FaPhone className="text-secondary" />
                                <span>+1 234 567 890</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <FaEnvelope className="text-secondary" />
                                <span>info@sizzora.com</span>
                            </li>
                            <li className="flex items-start gap-3 text-gray-400">
                                <FaMapMarkerAlt className="text-secondary mt-1" />
                                <span>123 Food Street, Flavor City, FC 12345</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar - Copyright & Legal */}
            <div className="border-t border-stone-800">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-gray-500 text-sm">
                                © {currentYear} <span className="text-primary font-semibold">Sizzora™</span>. All Rights Reserved.
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                                A registered trademark of Sizzora Foods International Ltd.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            <span className="hidden md:inline">|</span>
                            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                            <span className="hidden md:inline">|</span>
                            <Link to="/refund" className="hover:text-primary transition-colors">Refund Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
