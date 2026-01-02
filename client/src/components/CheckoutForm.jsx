import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CheckoutForm = ({ cart, total, onClose, onSubmit, isSubmitting, user }) => {
    const [formData, setFormData] = useState({
        customerName: user ? user.name : '',
        phoneNumber: user ? user.phone : '',
        shippingAddress: '',
        additionalDetails: ''
    });
    const [image, setImage] = useState(null);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Create FormData object for multipart upload
        const data = new FormData();
        data.append('customerName', formData.customerName);
        data.append('phoneNumber', formData.phoneNumber);
        data.append('shippingAddress', formData.shippingAddress);
        data.append('additionalDetails', formData.additionalDetails);
        data.append('totalAmount', total);
        data.append('userId', user ? user.id : 'guest_user');
        data.append('items', JSON.stringify(cart.map(item => ({
            product: item._id,
            quantity: item.quantity,
            price: item.price
        }))));

        if (image) {
            data.append('paymentProofImage', image);
        }

        onSubmit(data);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-bold mb-6 text-tomato border-b border-gray-700 pb-2">Complete Your Order</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!user && (
                        <>
                            <div>
                                <label className="block text-gray-400 mb-1">Full Name *</label>
                                <input name="customerName" required value={formData.customerName} onChange={handleInputChange} className="w-full bg-gray-700 rounded p-2 text-white focus:ring-1 focus:ring-gold outline-none" placeholder="John Doe" />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Phone Number *</label>
                                <input name="phoneNumber" required value={formData.phoneNumber} onChange={handleInputChange} className="w-full bg-gray-700 rounded p-2 text-white focus:ring-1 focus:ring-gold outline-none" placeholder="+1 234 567 890" />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-gray-400 mb-1">Delivery Address *</label>
                        <textarea name="shippingAddress" required value={formData.shippingAddress} onChange={handleInputChange} className="w-full bg-gray-700 rounded p-2 text-white focus:ring-1 focus:ring-gold outline-none" rows="2" placeholder="Street, Apt, City..." />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-1">Payment Proof (Screenshot) *</label>
                        <div className="bg-gray-700 p-4 rounded text-center border-2 border-dashed border-gray-600 hover:border-gray-500 cursor-pointer relative">
                            <input type="file" required accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                            {image ? (
                                <span className="text-green-400 font-bold">{image.name}</span>
                            ) : (
                                <span className="text-gray-400 text-sm">Click to upload payment screenshot</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-1">Additional Details (Optional)</label>
                        <textarea name="additionalDetails" value={formData.additionalDetails} onChange={handleInputChange} className="w-full bg-gray-700 rounded p-2 text-white focus:ring-1 focus:ring-gold outline-none" rows="2" placeholder="Allergies, door code..." />
                    </div>

                    <div className="text-xl font-bold text-right pt-2 border-t border-gray-700 mt-4">
                        Total: <span className="text-gold">${total.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded font-bold transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-tomato hover:bg-red-600 text-white py-2 rounded font-bold transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CheckoutForm;
