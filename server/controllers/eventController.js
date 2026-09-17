import Event from '../models/Event.js';
import Settings from '../models/Settings.js';
import Meeting from '../models/Meeting.js';
import Training from '../models/Training.js';

export const getCalendarEvents = async (req, res) => {
    try {
        const { month, year } = req.query;
        let dateFilter = {};

        if (month !== undefined && year !== undefined) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const startOfMonth = new Date(y, m, 1);
            const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59);
            dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
        }

        // 1. Fetch G2 Events / Milestones
        const events = await Event.find(dateFilter).sort({ date: 1 });
        const g2Entries = events.map(ev => ({
            id: ev._id,
            title: ev.title,
            description: ev.description,
            date: ev.date,
            time: ev.time || '17:00',
            location: ev.location,
            type: ev.type || 'Milestone',
            ownerModule: 'G2',
            createdBy: ev.createdBy || 'G2 Operations'
        }));

        // 2. Fetch G5 Meetings
        const meetings = await Meeting.find({ ...dateFilter, isArchived: false }).sort({ date: 1 });
        const g5MeetingEntries = meetings.map(m => ({
            id: m._id,
            title: m.name,
            description: m.devotion || m.announcements || 'Weekly G5 Drill & Fellowship',
            date: m.date,
            time: m.startTime || '20:30',
            location: m.location?.name || (m.campus === 'Valley Road' ? 'DAC 506' : 'Doulos Store'),
            type: 'Meeting',
            ownerModule: 'G5',
            createdBy: 'G5 Training Directorate',
            code: m.code
        }));

        // 3. Fetch G5 Trainings / Camps
        const trainings = await Training.find(dateFilter).sort({ date: 1 });
        const g5TrainingEntries = trainings.map(t => ({
            id: t._id,
            title: t.name || 'G5 Field Drill',
            description: t.topic || 'Cadre Competency Session',
            date: t.date,
            time: t.startTime || '14:00',
            location: t.location?.name || 'Freedom Base',
            type: 'Training',
            ownerModule: 'G5',
            createdBy: 'G5 Training Directorate'
        }));

        const unified = [...g2Entries, ...g5MeetingEntries, ...g5TrainingEntries];
        unified.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            success: true,
            count: unified.length,
            entries: unified
        });
    } catch (err) {
        console.error('Error in getCalendarEvents:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

export const getEvents = async (req, res) => {
    try {
        const semesterSetting = await Settings.findOne({ key: 'current_semester' });
        const currentSemester = semesterSetting ? semesterSetting.value : 'MAY-AUG 2026';
        
        const events = await Event.find({ semester: currentSemester, isPublished: true }).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getAllEventsAdmin = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const createEvent = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.semester) {
            const semSetting = await Settings.findOne({ key: 'current_semester' });
            payload.semester = semSetting ? semSetting.value : 'MAY-AUG 2026';
        }
        if (!payload.createdBy && req.user?.username) {
            payload.createdBy = req.user.username;
        }
        const event = new Event(payload);
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ message: 'Error creating event', error: err.message });
    }
};

export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(event);
    } catch (err) {
        res.status(400).json({ message: 'Error updating event', error: err.message });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting event', error: err.message });
    }
};

