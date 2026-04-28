import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import ChatWidget from '../components/ChatWidget';

const Account = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loadingInfo, setLoadingInfo] = useState(true);

    useEffect(() => {
        if (loading) return;
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

        fetchOrders();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, [user, loading, navigate]);

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
        if (s === 'pending') return { label: 'Pending', cls: 'bg-amber-400/15 text-amber-300 border-amber-400/35' };
        if (s === 'preparing') return { label: 'Preparing', cls: 'bg-sky-400/15 text-sky-300 border-sky-400/35' };
        if (s === 'out-for-delivery') return { label: 'Out for Delivery', cls: 'bg-violet-400/15 text-violet-300 border-violet-400/35' };
        if (s === 'delivered') return { label: 'Delivered', cls: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/35' };
        if (s === 'cancelled') return { label: 'Cancelled', cls: 'bg-red-400/15 text-red-300 border-red-400/35' };
        return { label: status, cls: 'bg-stone-600/40 text-stone-300 border-stone-500/40' };
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
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-center p-7 rounded-2xl border border-amber-900/40 mb-10"
                style={{ background: 'linear-gradient(135deg, #2A1E13 0%, #221710 50%, #1E1410 100%)' }}
            >
                <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-semibold text-stone-950 shrink-0"
                        style={{ background: 'linear-gradient(135deg, #E8963A, #C43B2C)' }}>
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-primary/70 text-xs font-semibold tracking-[0.22em] uppercase mb-1">Welcome back</p>
                        <h1 className="text-2xl font-semibold mb-2 text-cream">
                            {user.name}
                        </h1>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <p className="text-stone-400 text-sm">{user.email}</p>
                            {user.phone && <p className="text-stone-500 text-sm">{user.phone}</p>}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="mt-6 md:mt-0 border border-red-800/50 text-red-400/90 hover:bg-red-900/25 hover:border-red-700/60 font-medium px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                    Sign out
                </button>
            </motion.div>

            {/* Current Orders */}
            {user.role !== 'admin' && (
                <>
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-2xl font-semibold text-cream">Current Orders</h2>
                        {activeOrders.length > 0 && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                                {activeOrders.length} active
                            </span>
                        )}
                    </div>

                    {activeOrders.length === 0 ? (
                        <div className="p-8 rounded-2xl border border-amber-900/25 text-stone-400 text-center mb-8 text-sm"
                            style={{ background: 'linear-gradient(135deg, #221810 0%, #1C150D 100%)' }}>
                            <p className="text-stone-500 mb-1">Nothing cooking right now.</p>
                            <p className="text-stone-600 text-xs">Your active orders will appear here once placed.</p>
                        </div>
                    ) : (
                        <div className="grid gap-5 mb-12">
                            {activeOrders.map((order, idx) => {
                                const stepIdx = getStepIndex(order.status);
                                const cancelled = order.status?.toLowerCase() === 'cancelled';
                                const badge = getStatusBadge(order.status);
                                return (
                                    <motion.div
                                        key={order._id}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.08 }}
                                        className="rounded-2xl border border-amber-900/30 hover:border-amber-800/50 transition-colors overflow-hidden"
                                        style={{ background: 'linear-gradient(145deg, #2A1E13 0%, #221710 60%, #1E1410 100%)' }}
                                    >
                                        {/* Top accent strip */}
                                        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,150,58,0.5), transparent)' }} />

                                        <div className="p-6">
                                            {/* Order header */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <p className="text-xs text-stone-500 mb-1 tracking-wider uppercase">Order</p>
                                                    <p className="font-mono text-stone-300 text-sm mb-1">#{order._id.slice(-6)}</p>
                                                    <p className="text-2xl font-semibold text-cream">${order.totalAmount.toFixed(2)}</p>
                                                </div>
                                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </div>

                                            {/* Step tracker */}
                                            {cancelled ? (
                                                <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-red-900/10 border border-red-800/30 mb-5">
                                                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                                    <span className="text-red-400/90 text-sm">This order was cancelled.</span>
                                                </div>
                                            ) : (
                                                <div className="mb-6 px-2">
                                                    <div className="flex items-center">
                                                        {STATUS_STEPS.map((step, i) => {
                                                            const done = i <= stepIdx;
                                                            const current = i === stepIdx;
                                                            return (
                                                                <React.Fragment key={step}>
                                                                    <div className="flex flex-col items-center shrink-0">
                                                                        <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                                                            done
                                                                                ? 'border-primary bg-primary shadow-[0_0_14px_rgba(232,150,58,0.55)]'
                                                                                : 'border-stone-600 bg-stone-800/60'
                                                                        }`}>
                                                                            {done && (
                                                                                <svg className="w-3.5 h-3.5 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            )}
                                                                            {current && (
                                                                                <span className="absolute inset-0 rounded-full animate-ping bg-primary/35" />
                                                                            )}
                                                                        </div>
                                                                        <span className={`mt-2 text-[10px] font-medium text-center leading-tight max-w-[58px] ${done ? 'text-amber-300' : 'text-stone-500'}`}>
                                                                            {step}
                                                                        </span>
                                                                    </div>
                                                                    {i < STATUS_STEPS.length - 1 && (
                                                                        <div className="flex-1 h-0.5 mx-1.5 mb-5 rounded-full overflow-hidden bg-stone-700/50">
                                                                            <motion.div
                                                                                className="h-full bg-gradient-to-r from-primary to-amber-300 shadow-[0_0_8px_rgba(232,150,58,0.45)]"
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: i < stepIdx ? '100%' : '0%' }}
                                                                                transition={{ duration: 0.7, delay: i * 0.18 }}
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
                                            <div className="pt-4 border-t border-amber-900/25">
                                                <p className="text-xs text-stone-500 mb-2.5 uppercase tracking-wider">Items</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.items.map((item, idx) => (
                                                        <span key={idx} className="text-xs text-stone-300 bg-stone-800/60 border border-stone-700/60 px-3 py-1 rounded-lg">
                                                            {item.quantity}× {item.product?.name || 'Unknown'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Order History */}
                    <h2 className="text-2xl font-semibold text-cream mb-6">Order History</h2>
                    <div className="rounded-2xl border border-amber-900/30 overflow-hidden"
                        style={{ background: 'linear-gradient(145deg, #251B11 0%, #1E1510 100%)' }}>
                        {pastOrders.length === 0 ? (
                            <div className="p-8 text-center text-stone-500 text-sm">No past orders found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-amber-900/25 text-stone-500 text-xs font-medium uppercase tracking-wider">
                                        <tr style={{ backgroundColor: 'rgba(42, 28, 14, 0.5)' }}>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Order ID</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-900/20">
                                        {pastOrders.map(order => {
                                            const badge = getStatusBadge(order.status);
                                            return (
                                                <tr key={order._id} className="hover:bg-amber-900/10 transition-colors">
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
                                                    <td className="px-6 py-4 text-right font-semibold text-cream text-sm">
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
