const initialProducts = [
    {
        name: 'Classic Burger',
        category: 'Burgers',
        price: 12.99,
        description: 'Juicy beef patty with cheese, lettuce, tomato, and our secret sauce on a brioche bun.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop'
    }
];

async function testOrder() {
    try {
        console.log('1. Fetching products...');
        const productsResponse = await fetch('http://127.0.0.1:5000/api/products');

        if (!productsResponse.ok) {
            throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
        }

        const products = await productsResponse.json();

        if (products.length === 0) {
            console.error('No products found to test with.');
            return;
        }

        const product = products[0];
        console.log(`   Found product: ${product.name} (${product._id})`);

        const orderPayload = {
            userId: 'guest_debug_user',
            items: [
                {
                    product: product._id,
                    quantity: 2,
                    price: product.price
                }
            ],
            totalAmount: product.price * 2,
            shippingAddress: 'Debug Script Address'
        };

        console.log('2. Sending Order Payload:', JSON.stringify(orderPayload, null, 2));

        const orderResponse = await fetch('http://127.0.0.1:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const responseData = await orderResponse.json();

        if (orderResponse.ok) {
            console.log('SUCCESS: Order created!', responseData);
        } else {
            console.error('FAILURE: Server returned error:', responseData);
        }

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    }
}

testOrder();
