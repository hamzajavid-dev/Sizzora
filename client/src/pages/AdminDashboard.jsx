import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChevronDown, FaChevronUp, FaArchive, FaImage, FaTrash, FaCheck, FaBan, FaLightbulb, FaExclamationTriangle, FaGripVertical } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';
import { Reorder } from 'framer-motion';

// OrderRow Component
const OrderRow = ({ order, isArchived = false, expandedOrder, toggleOrderExpand, onArchive, onDelete, onStatusUpdate }) => {
    const isExpanded = expandedOrder === order._id;
    
    // Helper function to get full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        // For relative paths, ensure it starts with /
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cleanPath}`;
    };
    
    return (
        <>
            <tr className="hover:bg-stone-700/30 transition-colors cursor-pointer" onClick={() => toggleOrderExpand(order._id)}>
                <td className="py-4 pl-4 text-sm">{order._id?.slice(-6) || 'N/A'}</td>
                <td className="py-4 text-sm">{order.customerName || 'Unknown'}</td>
                <td className="py-4 text-sm font-bold text-primary">${order.totalAmount?.toFixed(2) || '0.00'}</td>
                <td className="py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                        }`}>
                        {order.status || 'Pending'}
                    </span>
                </td>
                <td className="py-4">
                    <div className="flex items-center gap-2">
                        <button className="text-primary hover:text-secondary transition-colors p-2">
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        {!isArchived && (
                            <>
                                {onArchive && (
                                    <button 
                                        className="text-yellow-500 hover:text-yellow-400 transition-colors p-2" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onArchive(order._id);
                                        }}
                                        title="Archive Order"
                                    >
                                        <FaArchive />
                                    </button>
                                )}
                                {onDelete && (
                                    <button 
                                        className="text-red-500 hover:text-red-400 transition-colors p-2" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(order._id);
                                        }}
                                        title="Delete Order"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </>
                        )}
                        {isArchived && onDelete && (
                            <button 
                                className="text-red-500 hover:text-red-400 transition-colors p-2" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(order._id);
                                }}
                                title="Delete Order Permanently"
                            >
                                <FaTrash />
                            </button>
                        )}
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-stone-700/20">
                    <td colSpan="5" className="py-4 px-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-2">Customer Details</h4>
                                    <p className="text-sm"><span className="text-gray-400">Name:</span> {order.customerName || 'N/A'}</p>
                                    <p className="text-sm"><span className="text-gray-400">Phone:</span> {order.phoneNumber || 'N/A'}</p>
                                    <p className="text-sm"><span className="text-gray-400">Address:</span> {order.shippingAddress || 'N/A'}</p>
                                    {order.additionalDetails && (
                                        <p className="text-sm"><span className="text-gray-400">Notes:</span> {order.additionalDetails}</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-2">Order Details</h4>
                                    <p className="text-sm"><span className="text-gray-400">Order ID:</span> {order._id}</p>
                                    <p className="text-sm"><span className="text-gray-400">Date:</span> {new Date(order.createdAt || order.originalCreatedAt).toLocaleString()}</p>
                                    <p className="text-sm"><span className="text-gray-400">Payment:</span> {order.paymentMethod || 'Cash on Delivery'}</p>
                                    {!isArchived && onStatusUpdate && (
                                        <div className="mt-3">
                                            <label className="text-sm text-gray-400 block mb-1">Update Status:</label>
                                            <select 
                                                value={order.status || 'pending'} 
                                                onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                                                className="bg-stone-700 text-white px-3 py-1.5 rounded-lg text-sm border border-stone-600 focus:border-primary outline-none cursor-pointer hover:bg-stone-600 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="out-for-delivery">Out for Delivery</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    )}
                                    {order.paymentProofImage && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-400 mb-1">Payment Proof:</p>
                                            <img 
                                                src={getImageUrl(order.paymentProofImage)} 
                                                alt="Payment Proof" 
                                                className="max-h-40 rounded-lg border border-stone-600 cursor-pointer hover:border-primary transition-colors" 
                                                onClick={() => window.open(getImageUrl(order.paymentProofImage), '_blank')}
                                                onError={(e) => {
                                                    console.error('Failed to load payment proof image:', order.paymentProofImage);
                                                    console.error('Full URL attempted:', getImageUrl(order.paymentProofImage));
                                                    e.target.style.border = '2px solid #ef4444';
                                                    e.target.alt = 'Image failed to load';
                                                    e.target.title = `Failed to load: ${order.paymentProofImage}`;
                                                }}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Click to view full size</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-primary mb-2">Order Items</h4>
                                <div className="space-y-2">
                                    {order.items?.map((item, idx) => {
                                        const product = item.product || item;
                                        return (
                                            <div key={idx} className="flex justify-between items-center bg-stone-800/50 p-2 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {product.image && <img src={getImageUrl(product.image)} alt={product.name} className="w-10 h-10 rounded object-cover" />}
                                                    <div>
                                                        <p className="text-sm font-semibold">{product.name}</p>
                                                        <p className="text-xs text-gray-400">${item.price} × {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const AdminDashboard = () => {
    const { user } = useAuth();
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

    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        price: '',
        description: '',
        image: null
    });
    const [imageInputType, setImageInputType] = useState('upload'); // 'upload' or 'url'

    const [trendingProducts, setTrendingProducts] = useState([]);
    const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
    const [categoryImageInputType, setCategoryImageInputType] = useState('upload');

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (typeof imagePath === 'string' && imagePath.startsWith('http')) return imagePath;
        // Check if it's a file object (preview)
        if (imagePath instanceof File) return URL.createObjectURL(imagePath);
        
        const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `http://localhost:5000${path}`;
    };

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
            } else if (activeTab === 'users') {
                const res = await axios.get('/api/auth/users');
                setUsers(res.data);
            } else if (activeTab === 'trending') {
                const res = await axios.get('/api/products/trending');
                setTrendingProducts(res.data);
                // Also fetch all products to allow adding to trending
                const allProds = await axios.get('/api/products');
                setProducts(allProds.data);
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

    const handleToggleTrending = async (productId, isTrending) => {
        try {
            await axios.put(`/api/products/${productId}`, { isTrending });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to update trending status');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            if (imageInputType === 'upload') {
                setNewProduct(prev => ({ ...prev, [name]: files[0] }));
            } else {
                setNewProduct(prev => ({ ...prev, [name]: value }));
            }
        } else {
             setNewProduct(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newProduct.name);
        formData.append('category', newProduct.category);
        formData.append('price', newProduct.price);
        formData.append('description', newProduct.description);
        if (newProduct.image) {
            formData.append('image', newProduct.image);
        }

        try {
            await axios.post('/api/products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setNewProduct({ name: '', category: '', price: '', description: '', image: null });
            fetchData();
            alert('Product added successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to add product');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await axios.delete(`/api/products/${productId}`);
            fetchData();
            alert('Product deleted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to delete product');
        }
    };

    const handleReorderCategories = async (newOrder) => {
        setCategories(newOrder);
        try {
            await axios.put('/api/categories/reorder', { 
                orderedIds: newOrder.map(cat => cat._id) 
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newCategory);
        if (newCategoryImage) {
            formData.append('image', newCategoryImage);
        }

        try {
            await axios.post('/api/categories', formData, {
                 headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setNewCategory('');
            setNewCategoryImage('');
            fetchData();
            alert('Category added successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to add category');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await axios.delete(`/api/categories/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete category');
        }
    };

    const toggleOrderExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const toggleFeedbackExpand = (feedbackId) => {
        setExpandedFeedback(expandedFeedback === feedbackId ? null : feedbackId);
    };

    const handleFeedbackStatus = async (id, status) => {
        try {
            await axios.put(`/api/feedback/${id}`, { status });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to update feedback status');
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await axios.delete(`/api/feedback/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete feedback');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`/api/auth/users/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete user');
        }
    };

    const handleArchiveOrder = async (orderId) => {
        if (!confirm('Are you sure you want to archive this order?')) return;
        try {
            await axios.post(`/api/orders/${orderId}/archive`);
            alert('Order archived successfully!');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to archive order');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/orders/${orderId}`);
            alert('Order deleted successfully!');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete order');
        }
    };

    const handleDeleteArchivedOrder = async (orderId) => {
        if (!confirm('Are you sure you want to permanently delete this archived order? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/orders/archived/${orderId}`);
            alert('Archived order deleted successfully!');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete archived order');
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
            alert('Order status updated successfully!');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to update order status');
        }
    };

    return (
        <div className="min-h-screen bg-stone-900 pt-32 px-4 text-white pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Header remains */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Admin Dashboard</h1>
                        <p className="text-gray-400 mt-1">Manage orders, products, and categories</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-stone-800/60 backdrop-blur-sm p-1.5 rounded-xl w-fit border border-primary/20 flex-wrap shadow-lg">
                    {['orders', 'archived', 'products', 'trending', 'feedback', 'users'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-md font-bold transition-all capitalize relative ${activeTab === tab
                                ? 'bg-gradient-to-r from-primary to-secondary text-stone-900 shadow-lg shadow-primary/30'
                                : 'text-gray-300 hover:text-white hover:bg-stone-700/70'
                                }`}
                        >
                            {tab === 'orders' ? 'Active Orders' : tab}
                            {tab === 'chat' && unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ... (Orders, Archived, Products tabs remain) ... */}
                {activeTab === 'orders' && (
                    <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-700/50">
                        <table className="w-full text-left">
                            <thead className="bg-stone-900/80 text-primary uppercase text-xs tracking-wider border-b border-primary/20">
                                <tr>
                                    <th className="py-4 pl-4">ID</th>
                                    <th className="py-4">Customer</th>
                                    <th className="py-4">Total</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-700">
                                {orders.length > 0 ? (
                                    orders.map(order => <OrderRow key={order._id} order={order} expandedOrder={expandedOrder} toggleOrderExpand={toggleOrderExpand} onArchive={handleArchiveOrder} onDelete={handleDeleteOrder} onStatusUpdate={handleStatusUpdate} />)
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">No active orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'archived' && (
                    <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-700/50">
                        <table className="w-full text-left">
                            <thead className="bg-stone-900/80 text-primary uppercase text-xs tracking-wider border-b border-primary/20">
                                <tr>
                                    <th className="py-4 pl-4">ID</th>
                                    <th className="py-4">Customer</th>
                                    <th className="py-4">Total</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-700">
                                {archivedOrders.length > 0 ? (
                                    archivedOrders.map(order => <OrderRow key={order._id} order={order} isArchived={true} expandedOrder={expandedOrder} toggleOrderExpand={toggleOrderExpand} onDelete={handleDeleteArchivedOrder} />)
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
                        {/* ... (Product Form and List remain same) ... */}
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
                                
                                <div className="bg-stone-700 p-3 rounded-lg border border-stone-600">
                                    <div className="flex gap-4 mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="imageType" 
                                                checked={imageInputType === 'upload'} 
                                                onChange={() => {
                                                    setImageInputType('upload');
                                                    setNewProduct(prev => ({ ...prev, image: null }));
                                                }}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm font-medium">Upload Image</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="imageType" 
                                                checked={imageInputType === 'url'} 
                                                onChange={() => {
                                                    setImageInputType('url');
                                                    setNewProduct(prev => ({ ...prev, image: '' }));
                                                }}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm font-medium">Image URL</span>
                                        </label>
                                    </div>
                                    
                                    {imageInputType === 'upload' ? (
                                        <input 
                                            name="image" 
                                            type="file" 
                                            onChange={handleInputChange} 
                                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-dark hover:file:bg-secondary transition-all cursor-pointer" 
                                            required={!newProduct.image} 
                                        />
                                    ) : (
                                        <input 
                                            name="image" 
                                            type="text" 
                                            value={typeof newProduct.image === 'string' ? newProduct.image : ''} 
                                            onChange={handleInputChange} 
                                            placeholder="https://example.com/image.jpg" 
                                            className="w-full bg-stone-800 p-2 rounded-md text-white border border-stone-600 focus:border-primary outline-none text-sm" 
                                            required={!newProduct.image} 
                                        />
                                    )}
                                </div>

                                {newProduct.image && (
                                    <div className="bg-stone-900 p-2 rounded-lg border border-stone-700">
                                        <p className="text-xs text-gray-400 mb-1">Preview:</p>
                                        <img src={getImageUrl(newProduct.image)} alt="Preview" className="h-32 rounded object-cover" />
                                    </div>
                                )}
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
                                    
                                    <div className="bg-stone-700 p-2 rounded-lg border border-stone-600">
                                        <div className="flex gap-4 mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="catImageType" 
                                                    checked={categoryImageInputType === 'upload'} 
                                                    onChange={() => {
                                                        setCategoryImageInputType('upload');
                                                        setNewCategoryImage(null);
                                                    }}
                                                    className="accent-primary"
                                                />
                                                <span className="text-xs font-medium">Upload</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="catImageType" 
                                                    checked={categoryImageInputType === 'url'} 
                                                    onChange={() => {
                                                        setCategoryImageInputType('url');
                                                        setNewCategoryImage('');
                                                    }}
                                                    className="accent-primary"
                                                />
                                                <span className="text-xs font-medium">URL</span>
                                            </label>
                                        </div>
                                        
                                        {categoryImageInputType === 'upload' ? (
                                            <input 
                                                type="file" 
                                                onChange={(e) => setNewCategoryImage(e.target.files[0])} 
                                                className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-dark hover:file:bg-secondary transition-all cursor-pointer" 
                                            />
                                        ) : (
                                            <input 
                                                type="text" 
                                                value={typeof newCategoryImage === 'string' ? newCategoryImage : ''} 
                                                onChange={(e) => setNewCategoryImage(e.target.value)} 
                                                placeholder="Image URL" 
                                                className="w-full bg-stone-800 p-1.5 rounded-md text-white border border-stone-600 focus:border-primary outline-none text-xs" 
                                            />
                                        )}
                                    </div>
                                    
                                    <button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-dark px-4 py-2 rounded-lg font-bold transition-all">Add Category</button>
                                </form>
                                <Reorder.Group axis="y" values={categories} onReorder={handleReorderCategories} className="flex flex-col gap-2">
                                    {categories.map(cat => (
                                        <Reorder.Item key={cat._id} value={cat} className="bg-stone-900 px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 border border-stone-700 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FaGripVertical className="text-stone-600" />
                                                {cat.image && <img src={getImageUrl(cat.image)} alt={cat.name} className="w-8 h-8 rounded object-cover" onError={(e) => { e.target.style.display = 'none'; }} />}
                                                <span className="font-medium">{cat.name}</span>
                                            </div>
                                            <button onClick={() => handleDeleteCategory(cat._id)} className="text-stone-500 hover:text-red-400 p-1"><FaTrash size={12} /></button>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="lg:col-span-2 bg-stone-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-stone-700/50">
                            <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Current Menu Items</h2>
                            <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2">
                                {products.map(p => (
                                    <div key={p._id} className="flex justify-between items-center bg-stone-700/30 p-4 rounded-xl hover:bg-stone-700/50 transition-colors border border-stone-700">
                                        <div className="flex items-center gap-4">
                                            <img src={getImageUrl(p.image)} alt={p.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                                            <div>
                                                <div className="font-bold text-lg">{p.name}</div>
                                                <div className="text-sm text-primary font-semibold">${p.price}</div>
                                                <div className="text-xs text-gray-500">{p.category}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteProduct(p._id)}
                                            className="text-gray-500 hover:text-red-400 transition-colors p-2"
                                            title="Delete Product"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Content - Trending */}
                {activeTab === 'trending' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add to Trending Panel */}
                        <div className="lg:col-span-1 bg-stone-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl h-fit border border-stone-700/50">
                            <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                Add to Trending
                            </h2>
                            <p className="text-gray-400 text-sm mb-4">Select a product to feature in the "Trending Now" section.</p>

                            <div className="flex flex-col gap-4">
                                <select
                                    value={selectedProductToAdd}
                                    onChange={(e) => setSelectedProductToAdd(e.target.value)}
                                    className="bg-stone-700 p-3 rounded-lg text-white border border-stone-600 focus:border-primary outline-none transition-colors"
                                >
                                    <option value="" disabled>Select Product</option>
                                    {products.filter(p => !p.isTrending).map(p => (
                                        <option key={p._id} value={p._id}>{p.name} (${p.price})</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => {
                                        if (selectedProductToAdd) {
                                            handleToggleTrending(selectedProductToAdd, true);
                                            setSelectedProductToAdd('');
                                        }
                                    }}
                                    disabled={!selectedProductToAdd}
                                    className={`font-bold py-3 rounded-lg transition-all shadow-lg ${!selectedProductToAdd ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-dark'}`}
                                >
                                    Add to Trending
                                </button>
                            </div>
                        </div>

                        {/* Trending List */}
                        <div className="lg:col-span-2 bg-stone-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-stone-700/50">
                            <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Currently Trending</h2>
                            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-4 text-yellow-200 text-sm">
                                <FaLightbulb className="inline mr-2" /> Note: You can remove items from this list, but the "Trending" category itself cannot be deleted.
                            </div>

                            <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2">
                                {trendingProducts.length > 0 ? (
                                    trendingProducts.map(p => (
                                        <div key={p._id} className="flex justify-between items-center bg-stone-700/30 p-4 rounded-xl hover:bg-stone-700/50 transition-colors border border-stone-700">
                                            <div className="flex items-center gap-4">
                                                <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                                                <div>
                                                    <div className="font-bold text-lg">{p.name}</div>
                                                    <div className="text-sm text-primary font-semibold">${p.price}</div>
                                                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Trending</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleToggleTrending(p._id, false)}
                                                className="bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-800/50 hover:border-red-500 transition-all px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
                                            >
                                                <FaTrash size={12} /> Remove
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">No items marked as trending.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* Content - Feedback */}
                {activeTab === 'feedback' && (
                    <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-700/50">
                        {/* ... (Feedback content remains) ... */}
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
                                                    {(item.message.length > 100 || item.image) && (
                                                        <button onClick={() => toggleFeedbackExpand(item._id)} className="text-primary text-sm mt-1 hover:underline flex items-center gap-1">
                                                            {expandedFeedback === item._id ? 'Show less' : (
                                                                <>
                                                                    {item.message.length > 100 ? 'Read more' : (item.image ? 'View Attachment' : '')}
                                                                    {item.image && <FaImage size={12} />}
                                                                </>
                                                            )}
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
                {/* ... (Users content remains) ... */}
                {activeTab === 'users' && (
                    <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-700/50">
                        <table className="w-full text-left">
                            <thead className="bg-stone-900/80 text-primary uppercase text-xs tracking-wider border-b border-primary/20">
                                <tr>
                                    <th className="py-4 pl-4">Name</th>
                                    <th className="py-4">Email</th>
                                    <th className="py-4">Phone</th>
                                    <th className="py-4">Role</th>
                                    <th className="py-4">Joined</th>
                                    <th className="py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-700">
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
            <ChatWidget user={user} isAdmin={true} />
        </div>
    );
};

export default AdminDashboard;
