import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChevronDown, FaChevronUp, FaArchive, FaImage, FaTrash, FaCheck, FaBan, FaLightbulb, FaExclamationTriangle } from 'react-icons/fa';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [archivedOrders, setArchivedOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [users, setUsers] = useState([]);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [expandedFeedback, setExpandedFeedback] = useState(null);
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState('');

    // Product Form State
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        price: '',
        description: '',
        image: ''
    });

    const fetchData = async () => {
        try {
            if (activeTab === 'orders') {
                const res = await axios.get('/api/orders/all');
                setOrders(res.data);
            } else if (activeTab === 'products') {
                const res = await axios.get('/api/products');
                setProducts(res.data);
            } else if (activeTab === 'archived') {
                const res = await axios.get('/api/orders/archived');
                setArchivedOrders(res.data);
            } else if (activeTab === 'feedback') {
                const res = await axios.get('/api/feedback');
                setFeedback(res.data);
            } else if (activeTab === 'feedback') {
                const res = await axios.get('/api/feedback');
                setFeedback(res.data);
            } else if (activeTab === 'users') {
                const res = await axios.get('/api/auth/users');
                setUsers(res.data);
            }
            const catRes = await axios.get('/api/categories');
            setCategories(catRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleArchiveOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to archive this order? It will be moved to history.')) return;
        try {
            await axios.post(`/api/orders/${orderId}/archive`);
            alert('Order Archived!');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to archive order');
        }
    };

    const handleDeleteArchivedOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this archived order?')) return;
        try {
            await axios.delete(`/api/orders/archived/${orderId}`);
            alert('Archived Order Deleted Permanently');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete archived order');
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/categories', { name: newCategory, image: newCategoryImage });
            setNewCategory('');
            setNewCategoryImage('');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to add category');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await axios.delete(`/api/categories/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete category');
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const handleFeedbackStatus = async (feedbackId, status) => {
        try {
            await axios.put(`/api/feedback/${feedbackId}/status`, { status });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to update feedback status');
        }
    };

    const handleDeleteFeedback = async (feedbackId) => {
        if (!window.confirm('Delete this feedback?')) return;
        try {
            await axios.delete(`/api/feedback/${feedbackId}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete feedback');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/auth/users/${userId}`);
            alert('User deleted successfully');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete user');
        }
    };

    const toggleExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const toggleFeedbackExpand = (feedbackId) => {
        setExpandedFeedback(expandedFeedback === feedbackId ? null : feedbackId);
    };

    const handleInputChange = (e) => {
        setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/products', newProduct);
            alert('Product Added!');
            setNewProduct({ name: '', category: '', price: '', description: '', image: '' });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error adding product');
        }
    };

    const OrderRow = ({ order, isArchived = false }) => (
        <>
            <tr className={`border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${expandedOrder === order._id ? 'bg-gray-700/50' : ''}`}>
                <td className="py-4 pl-4 font-mono text-sm text-gray-400">#{order._id.slice(-6)}</td>
                <td className="py-4 font-bold">
                    <div className="flex items-center gap-3">
                        {order.paymentProofImage && (
                            <img
                                src={order.paymentProofImage}
                                alt="Proof"
                                className="w-10 h-10 object-cover rounded border border-gray-600 cursor-pointer hover:scale-150 transition-transform"
                                onClick={(e) => { e.stopPropagation(); window.open(order.paymentProofImage, '_blank'); }}
                                title="View Payment Proof"
                            />
                        )}
                        <span>{order.customerName || 'Guest'}</span>
                    </div>
                </td>
                <td className="py-4 text-gold">${order.totalAmount?.toFixed(2)}</td>
                <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wide ${order.status === 'delivered' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                        order.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                                'bg-blue-900/50 text-blue-400 border border-blue-800'
                        }`}>
                        {order.status || 'Archived'}
                    </span>
                </td>
                <td className="py-4 flex gap-3 items-center">
                    <button onClick={() => toggleExpand(order._id)} className="text-gray-400 hover:text-white transition-colors">
                        {expandedOrder === order._id ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    {!isArchived && (
                        <>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                className="bg-gray-900 text-xs rounded border border-gray-600 p-1 outline-none focus:border-gold"
                            >
                                <option value="pending">Pending</option>
                                <option value="preparing">Preparing</option>
                                <option value="out-for-delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            {order.status === 'delivered' && (
                                <button
                                    onClick={() => handleArchiveOrder(order._id)}
                                    className="bg-gray-600 hover:bg-green-600 text-white p-2 rounded text-xs flex items-center gap-1 transition-colors"
                                    title="Archive Order"
                                >
                                    <FaArchive /> Archive
                                </button>
                            )}
                        </>
                    )}
                    {isArchived && (
                        <button
                            onClick={() => handleDeleteArchivedOrder(order._id)}
                            className="text-red-500 hover:text-red-400 p-2 transition-colors"
                            title="Delete Permanently"
                        >
                            <FaTrash />
                        </button>
                    )}
                </td>
            </tr>
            {expandedOrder === order._id && (
                <tr className="bg-gray-800/80">
                    <td colSpan="5" className="p-6 border-b border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-gold font-bold mb-3 border-b border-gray-600 pb-1">Customer Details</h3>
                                <p><span className="text-gray-400">Name:</span> {order.customerName}</p>
                                <p><span className="text-gray-400">Phone:</span> {order.phoneNumber}</p>
                                <p><span className="text-gray-400">Address:</span> {order.shippingAddress}</p>
                                {order.additionalDetails && <p><span className="text-gray-400">Note:</span> {order.additionalDetails}</p>}

                                <h3 className="text-gold font-bold mt-6 mb-3 border-b border-gray-600 pb-1">Order Items</h3>
                                <ul className="space-y-2">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between text-sm">
                                            <span>{item.quantity}x {item.product?.name || 'Unknown Product'}</span>
                                            <span className="text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-gold font-bold mb-3 border-b border-gray-600 pb-1">Payment Proof</h3>
                                {order.paymentProofImage ? (
                                    <div className="relative group">
                                        <img
                                            src={order.paymentProofImage}
                                            alt="Payment Proof"
                                            className="w-full max-w-xs rounded border border-gray-600 shadow-lg cursor-pointer transition-transform hover:scale-105"
                                            onClick={() => window.open(order.paymentProofImage, '_blank')}
                                        />
                                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                                            Click to Open
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic flex items-center gap-2"><FaImage /> No image uploaded</p>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-stone-900 pt-24 px-4 text-white pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Admin Dashboard</h1>
                        <p className="text-gray-400 mt-1">Manage orders, products, and categories</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-stone-800 p-1.5 rounded-xl w-fit border border-stone-700 flex-wrap">
                    {['orders', 'archived', 'products', 'feedback', 'users'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-md font-bold transition-all capitalize ${activeTab === tab
                                ? 'bg-gray-700 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            {tab === 'orders' ? 'Active Orders' : tab}
                        </button>
                    ))}
                </div>

                {/* Content - Active Orders */}
                {activeTab === 'orders' && (
                    <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-700/50">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="py-4 pl-4">ID</th>
                                    <th className="py-4">Customer</th>
                                    <th className="py-4">Total</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {orders.length > 0 ? (
                                    orders.map(order => <OrderRow key={order._id} order={order} />)
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">No active orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Content - Archived Orders */}
                {activeTab === 'archived' && (
                    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="py-4 pl-4">ID</th>
                                    <th className="py-4">Customer</th>
                                    <th className="py-4">Total</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {archivedOrders.length > 0 ? (
                                    archivedOrders.map(order => <OrderRow key={order._id} order={order} isArchived={true} />)
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">No archived cases found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Content - Products */}
                {activeTab === 'products' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add Product Form */}
                        <div className="lg:col-span-1 bg-stone-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl h-fit border border-stone-700/50">
                            <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary flex items-center gap-2">
                                <span className="text-2xl">+</span> Add New Product
                            </h2>
                            <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                                <input name="name" value={newProduct.name} onChange={handleInputChange} placeholder="Product Name" className="bg-stone-700 p-3 rounded-lg text-white border border-stone-600 focus:border-primary outline-none transition-colors" required />
                                <select name="category" value={newProduct.category} onChange={handleInputChange} className="bg-stone-700 p-3 rounded-lg text-white border border-stone-600 focus:border-primary outline-none transition-colors">
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <input name="price" type="number" value={newProduct.price} onChange={handleInputChange} placeholder="Price" className="bg-stone-700 p-3 rounded-lg text-white border border-stone-600 focus:border-primary outline-none transition-colors" required />
                                <textarea name="description" value={newProduct.description} onChange={handleInputChange} placeholder="Description" className="bg-stone-700 p-3 rounded-lg text-white border border-stone-600 focus:border-primary outline-none transition-colors" rows="3" required></textarea>
                                <input name="image" value={newProduct.image} onChange={handleInputChange} placeholder="Image URL (e.g. https://...)" className="bg-stone-700 p-3 rounded-lg text-white border border-stone-600 focus:border-primary outline-none transition-colors" required />
                                <button type="submit" className="bg-gradient-to-r from-secondary to-accent hover:from-accent hover:to-secondary text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-secondary/20">
                                    Add Product
                                </button>
                            </form>

                            {/* Category Management */}
                            <div className="mt-8 border-t border-stone-700 pt-6">
                                <h3 className="text-lg font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Manage Categories</h3>
                                <form onSubmit={handleAddCategory} className="flex flex-col gap-2 mb-4">
                                    <input
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder="Category Name"
                                        className="bg-stone-700 p-2 rounded-lg text-white border border-stone-600 outline-none focus:border-primary transition-colors"
                                        required
                                    />
                                    <input
                                        value={newCategoryImage}
                                        onChange={(e) => setNewCategoryImage(e.target.value)}
                                        placeholder="Category Image URL (optional)"
                                        className="bg-stone-700 p-2 rounded-lg text-white border border-stone-600 outline-none focus:border-primary text-sm transition-colors"
                                    />
                                    <button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-dark px-4 py-2 rounded-lg font-bold transition-all">Add Category</button>
                                </form>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <div key={cat._id} className="bg-stone-900 px-3 py-2 rounded-lg text-sm flex items-center gap-2 border border-stone-700">
                                            {cat.image && <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded object-cover" />}
                                            <span>{cat.name}</span>
                                            <button onClick={() => handleDeleteCategory(cat._id)} className="text-red-500 hover:text-red-400 ml-1"><FaTrash size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="lg:col-span-2 bg-stone-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-stone-700/50">
                            <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Current Menu Items</h2>
                            <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2">
                                {products.map(p => (
                                    <div key={p._id} className="flex justify-between items-center bg-stone-700/30 p-4 rounded-xl hover:bg-stone-700/50 transition-colors border border-stone-700">
                                        <div className="flex items-center gap-4">
                                            <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                                            <div>
                                                <div className="font-bold text-lg">{p.name}</div>
                                                <div className="text-sm text-primary font-semibold">${p.price}</div>
                                                <div className="text-xs text-gray-500">{p.category}</div>
                                            </div>
                                        </div>
                                        <button className="text-gray-500 hover:text-red-400 transition-colors p-2">
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Content - Feedback (Suggestions & Complaints) */}
                {activeTab === 'feedback' && (
                    <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-700/50">
                        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                Customer Feedback
                            </h2>
                            <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-1"><FaLightbulb className="text-primary" /> {feedback.filter(f => f.type === 'suggestion').length} Suggestions</span>
                                <span className="flex items-center gap-1"><FaExclamationTriangle className="text-secondary" /> {feedback.filter(f => f.type === 'complaint').length} Complaints</span>
                            </div>
                        </div>
                        <div className="divide-y divide-stone-700">
                            {feedback.length > 0 ? (
                                feedback.map(item => (
                                    <div key={item._id} className="p-4 hover:bg-stone-700/30 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'suggestion' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                                                    {item.type === 'suggestion' ? <FaLightbulb /> : <FaExclamationTriangle />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold">{item.name}</span>
                                                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${item.type === 'suggestion' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                                                            {item.type}
                                                        </span>
                                                        {item.complaintType && (
                                                            <span className="text-xs text-gray-400">• {item.complaintType}</span>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ml-auto ${item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            item.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                                                'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mt-1">{item.email} • {item.phone}</p>
                                                    <p className="text-gray-300 mt-2">{expandedFeedback === item._id ? item.message : item.message.substring(0, 100) + (item.message.length > 100 ? '...' : '')}</p>
                                                    {item.message.length > 100 && (
                                                        <button onClick={() => toggleFeedbackExpand(item._id)} className="text-primary text-sm mt-1 hover:underline">
                                                            {expandedFeedback === item._id ? 'Show less' : 'Read more'}
                                                        </button>
                                                    )}
                                                    {item.image && expandedFeedback === item._id && (
                                                        <img src={item.image} alt="Attachment" className="mt-3 max-h-40 rounded-lg border border-stone-600 cursor-pointer" onClick={() => window.open(item.image, '_blank')} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                {item.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleFeedbackStatus(item._id, 'resolved')} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors" title="Resolve">
                                                            <FaCheck />
                                                        </button>
                                                        <button onClick={() => handleFeedbackStatus(item._id, 'discarded')} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors" title="Discard">
                                                            <FaBan />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDeleteFeedback(item._id)} className="text-gray-500 hover:text-red-400 p-2 transition-colors" title="Delete">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    No feedback received yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* Content - Users */}
                {activeTab === 'users' && (
                    <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-700/50">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="py-4 pl-4">Name</th>
                                    <th className="py-4">Email</th>
                                    <th className="py-4">Phone</th>
                                    <th className="py-4">Role</th>
                                    <th className="py-4">Joined</th>
                                    <th className="py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {users.length > 0 ? (
                                    users.map(user => (
                                        <tr key={user._id} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="py-4 pl-4 font-bold">{user.name}</td>
                                            <td className="py-4 text-gray-300">{user.email}</td>
                                            <td className="py-4 text-gray-300">{user.phone || 'N/A'}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' : 'bg-blue-900/50 text-blue-400 border border-blue-800'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 text-gray-400 text-sm">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="text-gray-500 hover:text-red-500 p-2 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

