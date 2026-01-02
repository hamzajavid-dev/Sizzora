import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const Account = () => {
    const { user, logout, loading } = useAuth(); // Get loading state
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loadingInfo, setLoadingInfo] = useState(true);

    useEffect(() => {
        if (loading) return; // Wait for auth check to complete
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/orders/myorders/${user.id}`);
                setOrders(res.data);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setLoadingInfo(false);
            }
        };

        fetchOrders(); // Initial fetch

        // Polling to keep orders synced with admin
        const interval = setInterval(fetchOrders, 3000); // Polling every 3 seconds
        return () => clearInterval(interval);
    }, [user, loading, navigate]); // Add loading to dependencies

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'pending') return 'text-yellow-400';
        if (s === 'preparing') return 'text-blue-400';
        if (s === 'out-for-delivery') return 'text-purple-400';
        if (s === 'delivered') return 'text-green-400';
        if (s === 'cancelled') return 'text-red-400';
        return 'text-gray-400';
    };

    const getProgressWidth = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'pending') return '20%';
        if (s === 'preparing') return '40%';
        if (s === 'out-for-delivery') return '70%';
        if (s === 'delivered') return '100%';
        if (s === 'cancelled') return '100%';
        return '0%';
    };

    if (loading) {
        return <div className="min-h-screen pt-24 flex justify-center text-white">Loading...</div>;
    }

    if (!user) return null;

    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

            {/* Header / Profile */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-secondary/10 p-6 rounded-xl border border-secondary/30 mb-8 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Hello, <span className="text-accent">{user.name}</span>!</h1>
                    <p className="text-gray-400">Email: {user.email}</p>
                    <p className="text-gray-400">Phone: {user.phone}</p>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="mt-4 md:mt-0 bg-red-500/20 hover:bg-red-500/40 text-red-200 px-6 py-2 rounded-lg border border-red-500/50 transition-colors"
                >
                    Logout
                </button>
            </div>

            {/* Current Orders */}
            <h2 className="text-2xl font-bold text-white mb-4">Current Orders</h2>
            {activeOrders.length === 0 ? (
                <div className="bg-stone-800/50 p-6 rounded-xl border border-stone-700 text-gray-400 text-center mb-8">
                    No active orders at the moment.
                </div>
            ) : (
                <div className="grid gap-6 mb-12">
                    {activeOrders.map(order => (
                        <motion.div
                            key={order._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-stone-800 p-6 rounded-xl border border-secondary/30"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-400">Order ID: <span className="font-mono text-white">#{order._id.slice(-6)}</span></p>
                                    <p className="text-lg font-bold text-white mt-1">Total: ${order.totalAmount.toFixed(2)}</p>
                                </div>
                                <div className={`text-lg font-bold capitalize ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </div>
                            </div>

                            {/* Status Bar */}
                            <div className="w-full bg-stone-700 h-3 rounded-full mb-4 overflow-hidden relative">
                                <motion.div
                                    className={`h-full rounded-full ${order.status === 'cancelled' ? 'bg-red-500' : 'bg-accent'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: getProgressWidth(order.status) }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Pending</span>
                                <span>Preparing</span>
                                <span>Out for Delivery</span>
                                <span>Delivered</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-stone-700">
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">Items:</h4>
                                <ul className="list-disc list-inside text-gray-400 text-sm">
                                    {order.items.map((item, idx) => (
                                        <li key={idx}>
                                            {item.quantity}x {item.product?.name || 'Unknown Item'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Order History */}
            <h2 className="text-2xl font-bold text-white mb-4">Order History</h2>
            <div className="bg-stone-800 rounded-xl border border-stone-700 overflow-hidden">
                {pastOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No past orders found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-stone-900/50 text-gray-400 text-sm font-medium">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-700">
                                {pastOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-stone-700/30 transition-colors">
                                        <td className="px-6 py-4 text-gray-300">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-400">
                                            #{order._id.slice(-6)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize bg-opacity-10 border ${order.status === 'delivered'
                                                ? 'bg-green-500 text-green-400 border-green-500/30'
                                                : 'bg-red-500 text-red-400 border-red-500/30'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-white">
                                            ${order.totalAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="h-20"></div>
        </div>
    );
};

export default Account;
