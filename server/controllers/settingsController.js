import Settings from '../models/Settings.js';

export const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await Settings.findOne({ key });
        res.json(setting || { key, value: '' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const setting = await Settings.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
