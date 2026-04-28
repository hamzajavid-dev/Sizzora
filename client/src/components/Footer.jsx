import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTwitter, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="text-white border-t border-primary/10" style={{backgroundColor:'#0A0806'}}>
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-3xl font-semibold italic text-primary mb-2">Sizzora</h3>
                        <p className="text-stone-600 text-xs tracking-[0.2em] uppercase mb-5">Flame Kitchen</p>
                        <p className="text-stone-500 mb-7 max-w-md text-sm leading-relaxed">
                            Bold flavors, honest ingredients, delivered with care. Sizzora is where every meal becomes a moment.
                        </p>
                        <div className="flex space-x-3">
                            <a href="#" className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-800 text-stone-500 hover:border-primary/50 hover:text-primary transition-all duration-300">
                                <FaFacebookF size={14} />
                            </a>
                            <a href="#" className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-800 text-stone-500 hover:border-primary/50 hover:text-primary transition-all duration-300">
                                <FaInstagram size={14} />
                            </a>
                            <a href="#" className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-800 text-stone-500 hover:border-primary/50 hover:text-primary transition-all duration-300">
                                <FaTwitter size={14} />
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
            <div className="border-t border-stone-900/80">
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
