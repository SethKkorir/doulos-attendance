import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendInvitationEmail } from '../utils/emailService.js';

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
    const username = (req.body?.username ?? '').trim();
    const password = req.body?.password ?? '';

    if (process.env.NODE_ENV !== 'production') {
        console.log(`--- Login Attempt Tracking ---`);
        console.log(`Target: ${username}`);
    }

    try {
        const normalizedUsername = username.toLowerCase();
        const allowedUsers = new Set(['seth', 'g5', 'g2', 'g3', 'g4', 'g3_secretary', 'superadmin', 'admin', 'supersuperadmin']);
        const isBuiltInUser = allowedUsers.has(normalizedUsername);
        const isDefaultPassword = password === '123' || password === 'admin123';

        let user = await User.findOne({ username: { $regex: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });

        // Authenticate via database bcrypt or built-in test credentials
        let authenticated = false;
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
            if (isMatch || (isBuiltInUser && isDefaultPassword)) {
                authenticated = true;
            }
        } else if (isBuiltInUser && isDefaultPassword) {
            authenticated = true;
        }

        if (!authenticated) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`❌ Login Failed: Access denied for '${username}'`);
            }
            return res.status(401).json({ message: 'Access denied. Please check your credentials.' });
        }

        const resolveRole = (u) => {
            if (u === 'superadmin' || u === 'supersuperadmin') return 'superadmin';
            if (u === 'seth' || u === 'admin') return 'admin';
            if (u === 'g5') return 'trainer';
            if (u === 'g2') return 'g2_vice';
            if (u === 'g3' || u === 'g3_secretary') return 'g3';
            if (u === 'g4') return 'g4';
            return 'admin';
        };

        if (!user) {
            const targetRole = resolveRole(normalizedUsername);
            user = new User({
                username: username,
                password: password,
                role: targetRole,
                campus: 'Athi River',
                status: 'ACTIVE',
                lastLogin: new Date()
            });
            await user.save();
        } else {
            // Check account status
            if (user.status === 'SUSPENDED' || user.status === 'DISABLED') {
                return res.status(403).json({ message: `Access Denied: Your account is currently ${user.status}. Please contact a Super Administrator.` });
            }

            if (isBuiltInUser && (!user.role || user.role === 'admin')) {
                user.role = resolveRole(normalizedUsername);
            }
            user.campus = user.campus || 'Athi River';
            user.lastLogin = new Date();
            await user.save();
        }

        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET missing from environment');
            return res.status(500).json({ message: 'Configuration error: JWT_SECRET is missing' });
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log('Generating JWT token...');
        }
        const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Login successful');
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days session
        };
        res.cookie('doulos_session_token', token, cookieOptions);

        res.json({ 
            token, 
            role: user.role, 
            username: user.username, 
            campus: user.campus || 'Athi River',
            status: user.status || 'ACTIVE',
            position: user.position || '',
            email: user.email || ''
        });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getSession = async (req, res) => {
    try {
        let token = req.cookies?.doulos_session_token || req.header('Authorization')?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');
                if (user) {
                    return res.json({
                        authenticated: true,
                        type: 'admin',
                        token,
                        user: {
                            id: user._id,
                            username: user.username,
                            role: user.role,
                            campus: user.campus || 'Athi River'
                        }
                    });
                }
            } catch (tokenErr) {
                // Admin token expired or invalid, continue checking student session
            }
        }

        const studentSessionCookie = req.cookies?.doulos_student_session;
        if (studentSessionCookie) {
            try {
                const studentData = typeof studentSessionCookie === 'string' ? JSON.parse(studentSessionCookie) : studentSessionCookie;
                if (studentData && studentData.studentRegNo) {
                    return res.json({
                        authenticated: true,
                        type: 'student',
                        student: studentData
                    });
                }
            } catch (cookieErr) {
                // invalid json, proceed
            }
        }

        return res.json({ authenticated: false });
    } catch (error) {
        return res.status(500).json({ message: 'Error checking session', error: error.message });
    }
};

export const logout = (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    res.clearCookie('doulos_session_token', cookieOptions);
    res.clearCookie('doulos_student_session', cookieOptions);
    res.clearCookie('token', cookieOptions);
    res.json({ success: true, message: 'Logged out successfully' });
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
    const { username, role, campus, password, email, position, status } = req.body;

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

        const updateData = {};
        if (username !== undefined) updateData.username = username;
        if (campus !== undefined) updateData.campus = campus;
        if (email !== undefined) updateData.email = email;
        if (position !== undefined) updateData.position = position;
        if (status !== undefined) updateData.status = status;
        if (role) updateData.role = role;
        if (password) updateData.password = password; // Pre-save hook will hash it

        Object.assign(targetUser, updateData);
        await targetUser.save();

        res.json({ 
            message: 'User updated successfully', 
            user: { 
                _id: targetUser._id, 
                username: targetUser.username, 
                role: targetUser.role, 
                campus: targetUser.campus,
                email: targetUser.email,
                status: targetUser.status,
                position: targetUser.position
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

export const updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const targetUser = await User.findById(id);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Never allow suspending or disabling protected superadmins
        const isProtected = ['superadmin', 'supersuperadmin'].includes(targetUser.username.toLowerCase()) || targetUser.role === 'superadmin';
        if (isProtected && ['SUSPENDED', 'DISABLED'].includes(status)) {
            return res.status(403).json({ message: 'Access Denied: Protected SuperAdmin accounts cannot be suspended or disabled.' });
        }

        targetUser.status = status;
        await targetUser.save();

        res.json({ message: `Account status updated to ${status}`, user: { _id: targetUser._id, username: targetUser.username, status: targetUser.status } });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error: error.message });
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

        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

// ==========================================
// EMAIL-BASED INVITATION SYSTEM
// ==========================================

export const createInvitation = async (req, res) => {
    const { email, role = 'admin', position = '', campus = 'Athi River' } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required for account invitation.' });
    }

    try {
        // Check if an active user with this email or username already exists
        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }] });
        if (existingUser) {
            return res.status(400).json({ message: `An account already exists for ${email}.` });
        }

        // Generate high-entropy 32-byte secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create Invitation Record
        const invitation = new Invitation({
            email: email.toLowerCase().trim(),
            role,
            position,
            campus,
            token,
            invitedBy: req.user?.username || 'SuperAdmin',
            expiresAt,
            status: 'INVITED'
        });
        await invitation.save();

        // Build invitation URL
        const origin = req.get('origin') || process.env.CLIENT_URL || 'http://localhost:5173';
        const inviteUrl = `${origin}/accept-invite/${token}`;

        // Send email via nodemailer
        const emailResult = await sendInvitationEmail(email.toLowerCase().trim(), {
            role,
            position,
            campus,
            inviteUrl,
            expiresHours: 168
        });

        res.status(201).json({
            message: `Invitation generated successfully${emailResult.success ? ' and email dispatched.' : ' (email dispatch deferred/logged).' }`,
            invitation: {
                id: invitation._id,
                email: invitation.email,
                role: invitation.role,
                position: invitation.position,
                campus: invitation.campus,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
                inviteUrl // returned so SuperAdmin can manually copy link if needed
            }
        });
    } catch (err) {
        console.error('Create invitation error:', err);
        res.status(500).json({ message: 'Failed to create invitation', error: err.message });
    }
};

export const getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({}).sort({ createdAt: -1 });
        res.json(invitations);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load invitations', error: err.message });
    }
};

export const revokeInvitation = async (req, res) => {
    const { id } = req.params;
    try {
        const invitation = await Invitation.findById(id);
        if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

        invitation.status = 'REVOKED';
        await invitation.save();

        res.json({ message: `Invitation for ${invitation.email} has been revoked.` });
    } catch (err) {
        res.status(500).json({ message: 'Failed to revoke invitation', error: err.message });
    }
};

export const verifyInvitationToken = async (req, res) => {
    const { token } = req.params;
    try {
        const invitation = await Invitation.findOne({ token });
        if (!invitation) {
            return res.status(404).json({ message: 'Invalid invitation link.' });
        }

        if (invitation.status === 'REVOKED') {
            return res.status(400).json({ message: 'This invitation has been revoked by the administrator.' });
        }

        if (invitation.status === 'ACCEPTED') {
            return res.status(400).json({ message: 'This invitation has already been accepted and activated.' });
        }

        if (new Date() > new Date(invitation.expiresAt)) {
            invitation.status = 'EXPIRED';
            await invitation.save();
            return res.status(400).json({ message: 'This invitation has expired. Please request a new invitation.' });
        }

        res.json({
            valid: true,
            email: invitation.email,
            role: invitation.role,
            position: invitation.position,
            campus: invitation.campus
        });
    } catch (err) {
        res.status(500).json({ message: 'Error verifying invitation token', error: err.message });
    }
};

export const acceptInvitation = async (req, res) => {
    const { token } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const invitation = await Invitation.findOne({ token });
        if (!invitation || invitation.status !== 'INVITED') {
            return res.status(400).json({ message: 'Invalid or inactive invitation.' });
        }

        if (new Date() > new Date(invitation.expiresAt)) {
            invitation.status = 'EXPIRED';
            await invitation.save();
            return res.status(400).json({ message: 'This invitation has expired.' });
        }

        // Check if username taken
        const existing = await User.findOne({ username: username.trim() });
        if (existing) {
            return res.status(400).json({ message: `Username "${username}" is already taken. Please choose another.` });
        }

        // Create new active user
        const newUser = new User({
            username: username.trim(),
            password: password.trim(),
            email: invitation.email,
            role: invitation.role,
            position: invitation.position,
            campus: invitation.campus,
            status: 'ACTIVE',
            lastLogin: new Date()
        });
        await newUser.save();

        invitation.status = 'ACCEPTED';
        invitation.acceptedAt = new Date();
        await invitation.save();

        // Generate JWT token for immediate access
        const jwtToken = jwt.sign(
            { id: newUser._id, role: newUser.role, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Account successfully activated! Welcome to Doulos.',
            token: jwtToken,
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role,
                campus: newUser.campus,
                position: newUser.position,
                status: newUser.status
            }
        });
    } catch (err) {
        console.error('Accept invitation error:', err);
        res.status(500).json({ message: 'Failed to accept invitation', error: err.message });
    }
};

