import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/SIZZORA.png';

const Navbar = () => {
    const { cart } = useCart();
    const { user } = useAuth();
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <nav className="fixed w-full z-50 bg-gradient-to-r from-primary via-primary to-secondary backdrop-blur-md border-b border-secondary/30 text-dark shadow-lg shadow-primary/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <img src={logo} alt="Sizzora" className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300 drop-shadow-[0_2px_4px_rgba(254,183,5,0.3)]" />
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link to="/" className="hover:text-accent transition-colors px-3 py-2 rounded-md text-base font-semibold tracking-wide">Home</Link>
                            <Link to="/menu" className="hover:text-accent transition-colors px-3 py-2 rounded-md text-base font-semibold tracking-wide">Menu</Link>
                            <Link to="/about" className="hover:text-accent transition-colors px-3 py-2 rounded-md text-base font-semibold tracking-wide">About</Link>
                            <Link to="/contact" className="hover:text-accent transition-colors px-3 py-2 rounded-md text-base font-semibold tracking-wide">Contact</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/cart" className="relative p-2 hover:text-accent transition-colors group">
                            <FaShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-primary">{cartCount}</span>}
                        </Link>
                        <Link to={user ? "/account" : "/login"} className="p-2 hover:text-accent transition-colors group" title={user ? "Account" : "Login"}>
                            <FaUser size={22} className={`group-hover:scale-110 transition-transform ${user ? "text-accent" : ""}`} />
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
