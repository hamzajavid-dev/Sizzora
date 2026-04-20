const mongoose = require('mongoose');
const Order = require('./models/Order');
const ArchivedOrder = require('./models/ArchivedOrder');

mongoose.connect('mongodb://localhost:27017/sizzora').then(async () => {
    const orderCount = await Order.countDocuments();
    const archivedCount = await ArchivedOrder.countDocuments();
    console.log('Found', orderCount, 'active orders and', archivedCount, 'archived orders');
    
    await Order.deleteMany({});
    await ArchivedOrder.deleteMany({});
    
    console.log('✅ All orders deleted');
    mongoose.connection.close();
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
