const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const adminUser = {
    name: 'hamzajavid.sizzora@gmail.com',
    email: 'hamzajavid.sizzora@gmail.com',
    password: 'xxhamza123111Xyntoro123111Company123111xx',
    phone: '0000000000',
    role: 'admin',
    displayName: 'Muhammad Hamza Javid'
};

const seedAdmin = async () => {
    try {
        console.log('[SEED] Checking Admin User...');
        
        // Find existing admin or potentially conflicting accounts
        const existingAdmin = await User.findOne({
            $or: [
                { email: adminUser.email },
                { role: 'admin' } // Find ANY admin to ensure we have at least one or update the main one
            ]
        });

        if (existingAdmin && (existingAdmin.email === adminUser.email || existingAdmin.role === 'admin')) {
             // Only update if it's the specific main admin email, OR if we want to force reset the first found admin (optional, be careful)
             // Better: Update the specific admin if found by email. If not found, create.
             // If found by role but different email, ignore/log.
        }

        // Simpler logic: Ensure THE admin user exists with THE password.
        let targetAdmin = await User.findOne({ email: adminUser.email });

        if (targetAdmin) {
            console.log(`[SEED] Admin found (${adminUser.email}). Updating credentials...`);
            const salt = await bcrypt.genSalt(12);
            targetAdmin.password = await bcrypt.hash(adminUser.password, salt);
            targetAdmin.role = 'admin'; // Ensure role is admin
            targetAdmin.displayName = adminUser.displayName; // Sync display name
            await targetAdmin.save();
            console.log('[SEED] Admin credentials synced.');
        } else {
            console.log(`[SEED] Admin not found. Creating ${adminUser.email}...`);
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(adminUser.password, salt);
            
            targetAdmin = new User({
                name: adminUser.name,
                email: adminUser.email,
                password: hashedPassword,
                phone: adminUser.phone,
                role: 'admin',
                displayName: adminUser.displayName
            });
            await targetAdmin.save();
            console.log('[SEED] Admin created successfully.');
        }

    } catch (err) {
        console.error('[SEED] Admin Seed Error:', err);
    }
};

module.exports = seedAdmin;
