import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/doulos-attendance')
    .then(async () => {
        console.log('MongoDB Connected');

        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists.');
        } else {
            const admin = new User({ username: 'admin', password: 'admin123', role: 'admin' });
            await admin.save();
            console.log('Admin user created successfully.');
            console.log('Username: admin');
            console.log('Password: admin123');
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
