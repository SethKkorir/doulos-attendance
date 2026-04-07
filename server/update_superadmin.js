import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const updatePassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        const superAdmin = await User.findOne({ username: 'superadmin' });
        if (superAdmin) {
            superAdmin.password = '123';
            await superAdmin.save();
            console.log("Super Admin password updated successfully to '123'");
        } else {
            console.log("Super Admin not found. Creating one...");
            const newSuper = new User({ 
                username: 'superadmin', 
                password: '123', 
                role: 'superadmin',
                campus: 'Athi River'
            });
            await newSuper.save();
            console.log("New Super Admin created with password '123'");
        }
        process.exit();
    } catch (error) {
        console.error("Error updating password:", error);
        process.exit(1);
    }
};

updatePassword();
