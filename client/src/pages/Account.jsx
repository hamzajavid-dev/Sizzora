import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import ChatWidget from '../components/ChatWidget';

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
                const res = await axios.get(`/api/orders/myorders/${user.id}`);
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

    const STATUS_STEPS = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'];

    const getStepIndex = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'pending') return 0;
        if (s === 'preparing') return 1;
        if (s === 'out-for-delivery') return 2;
        if (s === 'delivered') return 3;
        return -1;
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'pending') return { label: 'Pending', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
        if (s === 'preparing') return { label: 'Preparing', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
        if (s === 'out-for-delivery') return { label: 'Out for Delivery', cls: 'bg-violet-500/10 text-violet-400 border-violet-500/30' };
        if (s === 'delivered') return { label: 'Delivered', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
        if (s === 'cancelled') return { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/30' };
        return { label: status, cls: 'bg-stone-700 text-stone-400 border-stone-600' };
    };

    if (loading) {
        return <div className="min-h-screen pt-24 flex justify-center text-white">Loading...</div>;
    }

    if (!user) return null;

    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header / Profile */}
            <div className="flex flex-col md:flex-row justify-between items-center p-7 rounded-2xl border border-stone-800 mb-10 backdrop-blur-md" style={{backgroundColor:'#161210'}}>
                <div>
                    <p className="text-primary/60 text-xs font-semibold tracking-[0.22em] uppercase mb-1">Welcome back</p>
                    <h1 className="text-3xl font-semibold mb-3 text-white">
                        {user.name}
                    </h1>
                    <div className="space-y-1">
                        <p className="text-stone-500 text-sm"><span className="text-stone-400 mr-2">{user.email}</span></p>
                        <p className="text-stone-500 text-sm"><span className="text-stone-400 mr-2">{user.phone}</span></p>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="mt-6 md:mt-0 border border-red-900/60 text-red-400 hover:bg-red-900/20 font-medium px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                    Sign out
                </button>
            </div>

            {/* Current Orders - Only for non-admin users */}
            {user.role !== 'admin' && (
                <>
                    <h2 className="text-2xl font-semibold text-white mb-6">Current Orders</h2>
                    {activeOrders.length === 0 ? (
                        <div className="p-6 rounded-xl border border-stone-800 text-stone-500 text-center mb-8 text-sm" style={{backgroundColor:'#161210'}}>
                            No active orders at the moment.
                        </div>
                    ) : (
                        <div className="grid gap-5 mb-12">
                            {activeOrders.map(order => {
                                const stepIdx = getStepIndex(order.status);
                                const cancelled = order.status?.toLowerCase() === 'cancelled';
                                const badge = getStatusBadge(order.status);
                                return (
                                    <motion.div
                                        key={order._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 rounded-2xl border border-stone-800 hover:border-stone-700 transition-colors"
                                        style={{backgroundColor:'#161210'}}
                                    >
                                        {/* Order header */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-xs text-stone-500 mb-1">Order <span className="font-mono text-stone-300">#{order._id.slice(-6)}</span></p>
                                                <p className="text-xl font-semibold text-white">${order.totalAmount.toFixed(2)}</p>
                                            </div>
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        {/* Step tracker */}
                                        {cancelled ? (
                                            <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-red-900/10 border border-red-900/30 mb-5">
                                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                                <span className="text-red-400 text-sm">This order was cancelled.</span>
                                            </div>
                                        ) : (
                                            <div className="mb-6">
                                                <div className="flex items-center">
                                                    {STATUS_STEPS.map((step, i) => {
                                                        const done = i <= stepIdx;
                                                        const current = i === stepIdx;
                                                        return (
                                                            <React.Fragment key={step}>
                                                                {/* Node */}
                                                                <div className="flex flex-col items-center shrink-0">
                                                                    <div className={`relative w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                                                        done
                                                                            ? 'border-primary bg-primary shadow-[0_0_12px_rgba(232,150,58,0.6)]'
                                                                            : 'border-stone-700 bg-stone-900'
                                                                    }`}>
                                                                        {done && (
                                                                            <svg className="w-3.5 h-3.5 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                        {current && (
                                                                            <span className="absolute inset-0 rounded-full animate-ping bg-primary/40" />
                                                                        )}
                                                                    </div>
                                                                    <span className={`mt-2 text-[10px] font-medium text-center leading-tight max-w-[56px] ${done ? 'text-primary' : 'text-stone-600'}`}>
                                                                        {step}
                                                                    </span>
                                                                </div>
                                                                {/* Connector */}
                                                                {i < STATUS_STEPS.length - 1 && (
                                                                    <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full overflow-hidden bg-stone-800">
                                                                        <motion.div
                                                                            className="h-full bg-gradient-to-r from-primary to-amber-400 shadow-[0_0_6px_rgba(232,150,58,0.5)]"
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: i < stepIdx ? '100%' : '0%' }}
                                                                            transition={{ duration: 0.6, delay: i * 0.15 }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div className="pt-4 border-t border-stone-800/80">
                                            <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider">Items</p>
                                            <div className="flex flex-wrap gap-2">
                                                {order.items.map((item, idx) => (
                                                    <span key={idx} className="text-xs text-stone-400 bg-stone-900 border border-stone-800 px-3 py-1 rounded-lg">
                                                        {item.quantity}× {item.product?.name || 'Unknown'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Order History */}
                    <h2 className="text-2xl font-semibold text-white mb-6">Order History</h2>
                    <div className="rounded-2xl border border-stone-800 overflow-hidden" style={{backgroundColor:'#161210'}}>
                        {pastOrders.length === 0 ? (
                            <div className="p-8 text-center text-stone-500 text-sm">No past orders found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-stone-800 text-stone-500 text-xs font-medium uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Order ID</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-800/60">
                                        {pastOrders.map(order => {
                                            const badge = getStatusBadge(order.status);
                                            return (
                                                <tr key={order._id} className="hover:bg-stone-800/30 transition-colors">
                                                    <td className="px-6 py-4 text-stone-400 text-sm">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-sm text-stone-500">
                                                        #{order._id.slice(-6)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${badge.cls}`}>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold text-white text-sm">
                                                        ${order.totalAmount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
            <ChatWidget user={user} isAdmin={false} />
        </div>
    );
};

export default Account;
