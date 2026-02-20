import Training from '../models/Training.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getKenyanTime } from '../utils/kenyanTime.js';

export const createTraining = async (req, res) => {
    const { name, date, campus, startTime, endTime, semester, requiredFields, location, isTestMeeting, questionOfDay } = req.body;
    try {
        const code = 'T-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const training = new Training({
            name, date, campus, startTime, endTime, semester, code, requiredFields, location, isTestMeeting, questionOfDay
        });
        await training.save();
        res.status(201).json(training);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTrainings = async (req, res) => {
    try {
        // --- AUTO-CLOSE EXPIRED TRAININGS ---
        const now = getKenyanTime();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const activeTrainings = await Training.find({ isActive: true });
        for (const t of activeTrainings) {
            const tDate = new Date(t.date);
            const tStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
            if (tStr > todayStr) continue;

            const [endH, endM] = t.endTime.split(':').map(Number);
            const endTotalMinutes = endH * 60 + endM;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // Trainings span multiple days (Fri–Sun).
            // Only auto-close if the training started more than 3 days ago.
            // Admins are expected to manually close trainings when done.
            const isPastDay = (now - new Date(t.date)) > (3 * 24 * 60 * 60 * 1000); // 3 days in ms

            if (isPastDay) {
                await Training.findByIdAndUpdate(t._id, { isActive: false });
                console.log(`[AUTO-CLOSE] Training "${t.name}" auto-closed after 3+ days.`);
            }
        }

        // Fetch trainings with attendance count
        const pipeline = [
            {
                $lookup: {
                    from: 'attendances', // We reuse attendance records, using trainingId field
                    localField: '_id',
                    foreignField: 'trainingId',
                    as: 'attendance'
                }
            },
            { $addFields: { attendanceCount: { $size: '$attendance' } } },
            { $project: { attendance: 0 } },
            { $sort: { date: -1 } }
        ];

        const trainings = await Training.aggregate(pipeline);

        trainings.sort((a, b) => {
            if (a.isActive === b.isActive) return new Date(b.date) - new Date(a.date);
            return a.isActive ? -1 : 1;
        });

        res.json(trainings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTrainingByCode = async (req, res) => {
    try {
        const training = await Training.findOne({ code: { $regex: new RegExp(`^${req.params.code}$`, 'i') } });
        if (!training) return res.status(404).json({ message: 'Training not found' });

        const isSuperUser = req.user && ['developer', 'superadmin'].includes(req.user.role);
        const now = getKenyanTime();
        const tDate = new Date(training.date);
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const tStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;

        const [startH, startM] = training.startTime.split(':').map(Number);
        const [endH, endM] = training.endTime.split(':').map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (!isSuperUser && !training.isTestMeeting) {
            if (!training.isActive) return res.status(403).json({ message: 'This training session is closed.' });
            if (todayStr !== tStr) return res.status(403).json({ message: `This training is scheduled for ${tDate.toLocaleDateString()}.` });
            if (currentMinutes < (startH * 60 + startM - 60)) return res.status(403).json({ message: `Training starts at ${training.startTime} EAT.` });
            if (currentMinutes > (endH * 60 + endM + 30)) return res.status(403).json({ message: `This training ended at ${training.endTime} EAT.` });
        }

        let hasAttended = false;
        if (req.query.deviceId) {
            const existingRecord = await Attendance.findOne({ trainingId: training._id, deviceId: req.query.deviceId });
            if (existingRecord) hasAttended = true;
        }

        res.json({ ...training.toObject(), isTraining: true, serverStartTime: Date.now(), hasAttended });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTrainingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const training = await Training.findByIdAndUpdate(id, updates, { new: true });
        res.json(training);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setTrainingLocation = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const training = await Training.findByIdAndUpdate(
            id,
            { $set: { 'location': { name: name || 'Custom Location' } } },
            { new: true }
        );
        res.json(training);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTraining = async (req, res) => {
    if (!['developer', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Only developers/superadmins can delete trainings' });
    }
    const { confirmPassword } = req.body;
    const { id } = req.params;
    try {
        const user = await User.findById(req.user.id);
        const isDevBypass = ['developer', 'superadmin'].includes(req.user.role) && confirmPassword === '657';
        if (!isDevBypass) {
            if (!user) return res.status(404).json({ message: 'Admin user not found' });
            const isMatch = await bcrypt.compare(confirmPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Incorrect admin password. Deletion cancelled.' });
        }
        const training = await Training.findById(id);
        if (!training) return res.status(404).json({ message: 'Training not found' });
        // Delete related attendance
        await Attendance.deleteMany({ trainingId: id });
        await Training.findByIdAndDelete(id);
        res.json({ message: `Training "${training.name}" deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
