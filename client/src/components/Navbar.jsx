import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaShoppingCart, FaTimes, FaUser } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { cart } = useCart();
    const { user } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const navItems = ['Home', 'Menu', 'About', 'Contact'];

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <nav className="fixed w-full z-50 top-0 left-0">
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(12,8,4,0.98)_0%,rgba(26,14,6,0.96)_50%,rgba(54,20,7,0.95)_100%)] backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_55%_120%_at_5%_0%,rgba(232,150,58,0.32),transparent),radial-gradient(ellipse_45%_110%_at_95%_0%,rgba(196,59,44,0.28),transparent)]" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link
                            to="/"
                            className="group flex items-center gap-3 rounded-2xl px-4 py-2 border border-primary/35 bg-white/[0.06] shadow-[0_8px_26px_rgba(0,0,0,0.35)] hover:border-primary/70 transition-all"
                        >
                            <div className="leading-tight">
                                <p className="text-cream text-[26px] leading-[0.95] font-semibold tracking-[0.06em] font-['Cormorant_Garamond']">Sizzora</p>
                                <p className="text-primary/80 text-[10px] font-semibold tracking-[0.22em] uppercase">Flame Kitchen</p>
                            </div>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2">
                        {navItems.map((item) => {
                            const path = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
                            const active = isActive(path);
                            return (
                                <Link
                                    key={item}
                                    to={path}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${active
                                        ? 'text-stone-950 bg-gradient-to-br from-primary via-amber-400 to-secondary shadow-[0_0_18px_rgba(232,150,58,0.55),inset_0_1px_0_rgba(255,255,255,0.25)]'
                                        : 'text-stone-300 hover:text-white hover:bg-white/[0.08]'}`}
                                >
                                    {item}
                                </Link>
                            );
                        })}
                        {user && user.role === 'admin' && (
                            <Link
                                to="/admin"
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive('/admin')
                                    ? 'text-stone-950 bg-gradient-to-br from-primary via-amber-400 to-secondary shadow-[0_0_18px_rgba(232,150,58,0.55),inset_0_1px_0_rgba(255,255,255,0.25)]'
                                    : 'text-stone-300 hover:text-white hover:bg-white/[0.08]'}`}
                            >
                                Dashboard
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link to="/cart" className="relative group">
                            <div className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20 shadow-sm">
                                <FaShoppingCart size={18} className="text-white group-hover:scale-110 transition-transform" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-md border border-white/70">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        </Link>

                        <Link to={user ? "/account" : "/login"} className="group relative">
                            <div className={`p-2.5 sm:p-3 rounded-xl transition-all border ${user
                                ? 'bg-primary/95 text-stone-950 border-primary shadow-md'
                                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
                                <FaUser size={18} className="group-hover:scale-110 transition-transform" />
                            </div>
                            {user && (
                                <span className="absolute top-11 right-0 bg-black/90 text-xs text-primary px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-primary/20">
                                    {user.name.split(' ')[0]}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className="md:hidden w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden pb-4 animate-[fadeIn_0.25s_ease]">
                        <div className="rounded-2xl border border-white/15 bg-black/35 backdrop-blur-xl p-3 space-y-2 shadow-2xl">
                            {navItems.map((item) => {
                                const path = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
                                const active = isActive(path);
                                return (
                                    <Link
                                        key={item}
                                        to={path}
                                        className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active
                                            ? 'bg-gradient-to-r from-primary to-secondary text-stone-950'
                                            : 'text-stone-100 bg-white/[0.04] hover:bg-white/[0.1]'}`}
                                    >
                                        {item}
                                    </Link>
                                );
                            })}
                            {user && user.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive('/admin')
                                        ? 'bg-gradient-to-r from-primary to-secondary text-stone-950'
                                        : 'text-stone-100 bg-white/[0.04] hover:bg-white/[0.1]'}`}
                                >
                                    Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
