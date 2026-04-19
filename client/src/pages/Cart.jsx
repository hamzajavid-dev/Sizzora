import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CheckoutForm from '../components/CheckoutForm';
import { getImageUrl } from '../utils/imageUtils';

const Cart = () => {
    const { cart, removeFromCart, clearCart, getCartTotal } = useCart();
    const [checkingOut, setCheckingOut] = useState(false);
    const navigate = useNavigate();

    const [showCheckout, setShowCheckout] = useState(false);
    const { user } = useAuth();

    const handleCheckoutClick = () => {
        if (!user) {
            navigate('/login', { state: { from: '/cart' } });
        } else {
            setShowCheckout(true);
        }
    };

    const handleOrderSubmit = async (formData) => {
        setCheckingOut(true);
        try {
            console.log('Submitting order to server...');
            console.log('FormData keys:', Array.from(formData.keys()));
            
            const response = await axios.post('/api/orders', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            
            console.log('Order created successfully:', response.data);
            clearCart();
            alert('Order placed successfully! We will contact you soon.');
            setShowCheckout(false);
            navigate('/menu');
        } catch (err) {
            console.error('Order submission error:', err);
            console.error('Error response:', err.response?.data);
            alert(`Failed to place order: ${err.response?.data?.error || err.message}`);
        } finally {
            setCheckingOut(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-stone-900 pt-32 px-4 text-white text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto"
                >
                    <h1 className="text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Your Cart is Empty</h1>
                    <p className="text-gray-400 mb-8 text-lg">Looks like you haven't added any delicious items yet.</p>
                    <Link to="/menu" className="inline-block bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-stone-900 font-extrabold uppercase tracking-widest py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105">
                        Browse Menu
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-900 pt-32 pb-24 px-4 text-white">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-extrabold mb-8 border-b-2 border-primary/20 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary inline-block">Your Cart</h1>

                <div className="grid gap-6">
                    {cart.map(item => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-stone-800/60 backdrop-blur-sm p-4 rounded-xl border border-stone-700/50 hover:border-primary/30 transition-all flex items-center justify-between group shadow-lg"
                        >
                            <div className="flex items-center gap-6">
                                <img src={getImageUrl(item.image)} alt={item.name} className="w-24 h-24 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform" />
                                <div>
                                    <h3 className="font-bold text-xl text-white mb-1">{item.name}</h3>
                                    <p className="text-primary font-bold text-lg">${item.price.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="font-bold text-xl bg-stone-900 px-4 py-2 rounded-lg border border-stone-700">x{item.quantity}</div>
                                <button
                                    onClick={() => removeFromCart(item._id)}
                                    className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-full transition-colors"
                                    title="Remove Item"
                                >
                                    <FaTrash size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-10 bg-stone-800/80 p-8 rounded-2xl border border-primary/20 flex flex-col md:flex-row justify-between items-center shadow-xl">
                    <div className="text-3xl font-extrabold mb-6 md:mb-0">
                        Total: <span className="text-primary drop-shadow-[0_0_10px_rgba(254,183,5,0.4)]">${getCartTotal().toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleCheckoutClick}
                        className="bg-gradient-to-r from-secondary to-accent hover:from-accent hover:to-secondary text-white font-bold uppercase tracking-widest py-4 px-10 rounded-lg text-lg shadow-[0_0_20px_rgba(247,68,7,0.3)] transition-all transform hover:scale-105"
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>

            {showCheckout && (
                <CheckoutForm
                    cart={cart}
                    total={getCartTotal()}
                    onClose={() => setShowCheckout(false)}
                    onSubmit={handleOrderSubmit}
                    isSubmitting={checkingOut}
                    user={user}
                />
            )}
        </div>
    );
};

export default Cart;
