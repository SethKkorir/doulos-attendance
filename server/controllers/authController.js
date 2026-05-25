import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
    const { username, password, role, campus } = req.body;
    
    // Only SuperAdmins and Developers can create admin/superadmin accounts
    const allowedCreatorRoles = ['superadmin', 'developer'];
    if (!req.user || !allowedCreatorRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access Denied: Only SuperAdmins and Developers can create admin or superadmin accounts.' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Validate and assign target role (default to 'admin')
        const targetRole = role && ['admin', 'superadmin', 'developer'].includes(role) ? role : 'admin';

        const user = new User({ 
            username, 
            password, 
            role: targetRole,
            campus: campus || 'Athi River'
        });
        await user.save();
        res.status(201).json({ message: 'Account registered successfully', user: { username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    if (process.env.NODE_ENV !== 'production') {
        console.log(`--- Login Attempt Tracking ---`);
        console.log(`Target: ${username}`);
    }
    
    try {
        // Case-insensitive lookup
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } });

        if (!user) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`❌ Login Failed: User '${username}' not found in registry.`);
            }
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`❌ Login Failed: Incorrect password for '${user.username}'`);
            }
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET missing from environment');
            return res.status(500).json({ message: 'Configuration error: JWT_SECRET is missing' });
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log('Generating JWT token...');
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Login successful');
        }
        res.json({ token, role: user.role, username: user.username });
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

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ username: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, role, campus, password } = req.body;

    try {
        const targetUser = await User.findById(id);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Security check: Only SuperAdmins and Developers can change roles or update a SuperAdmin account
        const allowedEditorRoles = ['superadmin', 'developer'];
        
        // 1. If trying to edit a superadmin/developer account
        const isTargetSuper = ['superadmin', 'developer'].includes(targetUser.role);
        if (isTargetSuper && (!req.user || !allowedEditorRoles.includes(req.user.role))) {
            return res.status(403).json({ message: 'Access Denied: Only SuperAdmins and Developers can modify a SuperAdmin or Developer account.' });
        }

        // 2. If trying to promote someone to superadmin/developer
        const isPromotingToSuper = role && ['superadmin', 'developer'].includes(role);
        if (isPromotingToSuper && (!req.user || !allowedEditorRoles.includes(req.user.role))) {
            return res.status(403).json({ message: 'Access Denied: Only SuperAdmins and Developers can assign SuperAdmin or Developer privileges.' });
        }

        const updateData = { username, campus };
        if (role) {
            updateData.role = role;
        }
        if (password) {
            updateData.password = password; // Pre-save hook will hash it
        }

        Object.assign(targetUser, updateData);
        await targetUser.save();

        res.json({ message: 'User updated successfully', user: { _id: targetUser._id, username: targetUser.username, role: targetUser.role, campus: targetUser.campus } });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const targetUser = await User.findById(id);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        if (targetUser.role === 'superadmin' || targetUser.username.toLowerCase() === 'superadmin' || targetUser.username.toLowerCase() === 'supersuperadmin') {
            return res.status(403).json({ message: 'Access Denied: The SuperAdmin account is protected and cannot be deleted under any circumstances.' });
        }

        const user = await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

// No provisionAccount needed
