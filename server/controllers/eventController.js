import Event from '../models/Event.js';
import Settings from '../models/Settings.js';

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
}

export const createEvent = async (req, res) => {
    try {
        const event = new Event(req.body);
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
