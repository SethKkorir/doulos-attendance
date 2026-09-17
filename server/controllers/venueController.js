import Venue from '../models/Venue.js';

export const getVenues = async (req, res) => {
    try {
        const { campus } = req.query;
        const query = {};
        if (campus && campus !== 'All') {
            query.$or = [{ campus }, { campus: 'Both' }];
        }

        const venues = await Venue.find(query).sort({ isDefault: -1, name: 1 });
        res.json({ success: true, count: venues.length, venues });
    } catch (err) {
        console.error('Error fetching venues:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

export const addVenue = async (req, res) => {
    try {
        const { name, title, sub, campus, latitude, longitude, radius, isDefault } = req.body;

        if (!name || !campus) {
            return res.status(400).json({ success: false, message: 'Name and campus are required' });
        }

        const venue = new Venue({
            name: name.trim(),
            title: title || name,
            sub: sub || `${campus} Campus`,
            campus,
            latitude: latitude ? Number(latitude) : null,
            longitude: longitude ? Number(longitude) : null,
            radius: radius ? Number(radius) : 200,
            isDefault: !!isDefault
        });

        await venue.save();

        res.status(201).json({ success: true, message: 'Venue created', venue });
    } catch (err) {
        console.error('Error creating venue:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
