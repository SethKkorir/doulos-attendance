import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/doulos-attendance')
    .then(async () => {
        console.log('MongoDB Connected');

        const superAdminExists = await User.findOne({ username: 'superadmin' });
        if (superAdminExists) {
            console.log('Super Admin user already exists. Updating role...');
            superAdminExists.role = 'superadmin';
            await superAdminExists.save();
            console.log('Role updated to superadmin!');
        } else {
            const superAdmin = new User({ 
                username: 'superadmin', 
                password: 'superpassword123', 
                role: 'superadmin',
                campus: 'Athi River'
            });
            await superAdmin.save();
            console.log('Super Admin user created successfully.');
            console.log('Username: superadmin');
            console.log('Password: superpassword123');
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
