import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CheckoutForm from '../components/CheckoutForm';

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
            await axios.post('/api/orders', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            clearCart();
            alert('Order placed successfully! We will contact you soon.');
            setShowCheckout(false);
            navigate('/menu');
        } catch (err) {
            console.error(err);
            alert(`Failed to place order: ${err.response?.data?.error || err.message}`);
        } finally {
            setCheckingOut(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 pt-24 px-4 text-white text-center">
                <h1 className="text-3xl font-bold mb-8">Your Cart is Empty</h1>
                <Link to="/menu" className="bg-gold text-gray-900 font-bold py-2 px-6 rounded-full hover:bg-yellow-400">Browse Menu</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pt-24 px-4 text-white">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 border-b border-gray-700 pb-4">Your Cart</h1>

                <div className="grid gap-6">
                    {cart.map(item => (
                        <div key={item._id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                                <div>
                                    <h3 className="font-bold text-lg">{item.name}</h3>
                                    <p className="text-gray-400">${item.price.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="font-bold text-xl">x{item.quantity}</div>
                                <button onClick={() => removeFromCart(item._id)} className="text-red-500 hover:text-red-400"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 border-t border-gray-700 pt-6 flex justify-between items-center">
                    <div className="text-2xl font-bold">Total: <span className="text-tomato">${getCartTotal().toFixed(2)}</span></div>
                    <button
                        onClick={handleCheckoutClick}
                        className="bg-gold hover:bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-full text-lg"
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
