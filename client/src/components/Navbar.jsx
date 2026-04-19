import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/SIZZORA.png';

const Navbar = () => {
    const { cart } = useCart();
    const { user } = useAuth();
    const location = useLocation();
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed w-full z-50 top-0 left-0 transition-all duration-300 shadow-xl">
            {/* Gradient Background - Yellow to Orange */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-secondary">
                <div className="absolute inset-0 bg-white/10 opacity-20 pointer-events-none"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="flex items-center justify-between h-24">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-3 group relative">
                            {/* Logo with slight hover boost */}
                            <img
                                src={logo}
                                alt="Sizzora"
                                className="h-16 w-auto object-contain relative z-10 transform group-hover:scale-105 transition-transform duration-300 filter drop-shadow-sm"
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-10">
                        {['Home', 'Menu', 'About', 'Contact'].map((item) => {
                            const path = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
                            const active = isActive(path);
                            return (
                                <Link
                                    key={item}
                                    to={path}
                                    className={`relative font-extrabold text-lg transition-colors py-2 group ${active ? 'text-white' : 'text-stone-900 hover:text-white'}`}
                                >
                                    {item}
                                    <span className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                            );
                        })}
                        {user && user.role === 'admin' && (
                            <Link
                                to="/admin"
                                className={`relative font-extrabold text-lg transition-colors py-2 group ${isActive('/admin') ? 'text-white' : 'text-stone-900 hover:text-white'}`}
                            >
                                Dashboard
                                <span className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 ${isActive('/admin') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                            </Link>
                        )}
                    </div>

                    {/* Icons Section */}
                    <div className="flex items-center gap-6">
                        <Link to="/cart" className="relative group">
                            <div className="p-3 bg-white/20 hover:bg-white/40 rounded-full transition-colors backdrop-blur-sm border border-white/20 shadow-sm">
                                <FaShoppingCart size={20} className="text-stone-900 group-hover:scale-110 transition-transform" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse border border-white">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        </Link>

                        <Link to={user ? "/account" : "/login"} className="group relative">
                            <div className={`p-3 rounded-full transition-all border ${user ? 'bg-stone-900 text-primary border-stone-900' : 'bg-white/20 text-stone-900 border-white/20 hover:bg-white/40'}`}>
                                <FaUser size={20} className="group-hover:scale-110 transition-transform" />
                            </div>
                            {user && <span className="absolute top-12 right-0 bg-stone-900 text-xs text-primary px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-primary/20">
                                {user.name.split(' ')[0]}
                            </span>}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
