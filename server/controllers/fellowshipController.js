import Fellowship from '../models/Fellowship.js';

// Auto-activate scheduled fellowships whose scheduledAt <= now
const activateScheduled = async () => {
    try {
        const now = new Date();
        await Fellowship.updateMany(
            { status: 'SCHEDULED', scheduledAt: { $lte: now } },
            { $set: { status: 'PUBLISHED', publishedAt: now } }
        );
    } catch (e) {
        console.error('Error activating scheduled fellowships:', e.message);
    }
};

export const getFellowships = async (req, res) => {
    try {
        await activateScheduled();
        const { status, campus, search } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.status = status.toUpperCase();
        }

        if (campus && campus !== 'All') {
            filter.$or = [{ campus: 'All' }, { campus }];
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { title: regex },
                { theme: regex },
                { scriptureReference: regex }
            ];
        }

        const fellowships = await Fellowship.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .lean();

        res.json(fellowships);
    } catch (err) {
        console.error('Error fetching fellowships:', err);
        res.status(500).json({ message: 'Failed to fetch fellowships' });
    }
};

export const getTodayFellowship = async (req, res) => {
    try {
        await activateScheduled();
        const { campus } = req.query;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Try finding published fellowship strictly for today
        const query = {
            status: 'PUBLISHED',
            date: { $gte: startOfDay, $lte: endOfDay }
        };

        if (campus && campus !== 'All') {
            query.$or = [{ campus: 'All' }, { campus }];
        }

        let fellowship = await Fellowship.findOne(query).sort({ publishedAt: -1, date: -1 });

        // 2. Fallback to latest published fellowship so members always have a word to reflect upon
        if (!fellowship) {
            const fallbackQuery = { status: 'PUBLISHED' };
            if (campus && campus !== 'All') {
                fallbackQuery.$or = [{ campus: 'All' }, { campus }];
            }
            fellowship = await Fellowship.findOne(fallbackQuery).sort({ publishedAt: -1, date: -1 });
        }

        if (!fellowship) {
            return res.status(200).json(null);
        }

        res.json(fellowship);
    } catch (err) {
        console.error('Error fetching today fellowship:', err);
        res.status(500).json({ message: 'Failed to load today fellowship' });
    }
};

export const getFellowshipById = async (req, res) => {
    try {
        await activateScheduled();
        const fellowship = await Fellowship.findById(req.params.id);
        if (!fellowship) {
            return res.status(404).json({ message: 'Fellowship not found' });
        }
        res.json(fellowship);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving fellowship' });
    }
};

export const createFellowship = async (req, res) => {
    try {
        const {
            title,
            date,
            theme,
            scriptureReference,
            scriptureText,
            devotional,
            reflectionQuestion,
            prayer,
            communityPrompt,
            coverImage,
            campus,
            status,
            scheduledAt
        } = req.body;

        const creator = req.user?.username || 'G3/G4 Spiritual Coordinator';

        const fellowship = new Fellowship({
            title: title || 'Untitled Fellowship',
            date: date ? new Date(date) : new Date(),
            theme: theme || '',
            scriptureReference: scriptureReference || '',
            scriptureText: scriptureText || '',
            devotional: devotional || '',
            reflectionQuestion: reflectionQuestion || '',
            prayer: prayer || '',
            communityPrompt: communityPrompt || '',
            coverImage: coverImage || '',
            campus: campus || 'All',
            status: status || 'DRAFT',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            publishedAt: status === 'PUBLISHED' ? new Date() : null,
            createdBy: creator
        });

        fellowship.calculateCompletion();
        await fellowship.save();

        res.status(201).json(fellowship);
    } catch (err) {
        console.error('Error creating fellowship:', err);
        res.status(400).json({ message: err.message || 'Failed to create fellowship' });
    }
};

export const updateFellowship = async (req, res) => {
    try {
        const fellowship = await Fellowship.findById(req.params.id);
        if (!fellowship) {
            return res.status(404).json({ message: 'Fellowship not found' });
        }

        const fields = [
            'title', 'date', 'theme', 'scriptureReference', 'scriptureText',
            'devotional', 'reflectionQuestion', 'prayer', 'communityPrompt',
            'coverImage', 'campus', 'status', 'scheduledAt'
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                fellowship[field] = req.body[field];
            }
        });

        if (req.body.status === 'PUBLISHED' && !fellowship.publishedAt) {
            fellowship.publishedAt = new Date();
        }

        fellowship.updatedBy = req.user?.username || 'G3/G4 Coordinator';
        fellowship.calculateCompletion();
        await fellowship.save();

        res.json(fellowship);
    } catch (err) {
        console.error('Error updating fellowship:', err);
        res.status(400).json({ message: err.message || 'Failed to update fellowship' });
    }
};

export const publishFellowship = async (req, res) => {
    try {
        const fellowship = await Fellowship.findById(req.params.id);
        if (!fellowship) {
            return res.status(404).json({ message: 'Fellowship not found' });
        }

        fellowship.status = 'PUBLISHED';
        fellowship.publishedAt = new Date();
        fellowship.updatedBy = req.user?.username || 'G3/G4 Coordinator';
        fellowship.calculateCompletion();
        await fellowship.save();

        res.json({ message: 'Fellowship published successfully', fellowship });
    } catch (err) {
        res.status(500).json({ message: 'Failed to publish fellowship' });
    }
};

export const scheduleFellowship = async (req, res) => {
    try {
        const { scheduledAt } = req.body;
        if (!scheduledAt) {
            return res.status(400).json({ message: 'Schedule date and time is required' });
        }

        const fellowship = await Fellowship.findById(req.params.id);
        if (!fellowship) {
            return res.status(404).json({ message: 'Fellowship not found' });
        }

        fellowship.status = 'SCHEDULED';
        fellowship.scheduledAt = new Date(scheduledAt);
        fellowship.updatedBy = req.user?.username || 'G3/G4 Coordinator';
        fellowship.calculateCompletion();
        await fellowship.save();

        res.json({ message: 'Fellowship scheduled successfully', fellowship });
    } catch (err) {
        res.status(500).json({ message: 'Failed to schedule fellowship' });
    }
};

export const archiveFellowship = async (req, res) => {
    try {
        const fellowship = await Fellowship.findById(req.params.id);
        if (!fellowship) {
            return res.status(404).json({ message: 'Fellowship not found' });
        }

        fellowship.status = 'ARCHIVED';
        fellowship.updatedBy = req.user?.username || 'G3/G4 Coordinator';
        await fellowship.save();

        res.json({ message: 'Fellowship archived successfully', fellowship });
    } catch (err) {
        res.status(500).json({ message: 'Failed to archive fellowship' });
    }
};

export const deleteFellowship = async (req, res) => {
    try {
        const fellowship = await Fellowship.findByIdAndDelete(req.params.id);
        if (!fellowship) {
            return res.status(404).json({ message: 'Fellowship not found' });
        }
        res.json({ message: 'Fellowship removed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete fellowship' });
    }
};

// Track interaction without storing sensitive telemetry
export const recordInteraction = async (req, res) => {
    try {
        const { type } = req.body; // 'opened' | 'reflected' | 'prayer'
        const inc = {};

        if (type === 'opened') inc.openedCount = 1;
        else if (type === 'reflected') inc.reflectionsCount = 1;
        else if (type === 'prayer') inc.prayerInteractionsCount = 1;
        else return res.status(400).json({ message: 'Invalid interaction type' });

        const updated = await Fellowship.findByIdAndUpdate(
            req.params.id,
            { $inc: inc },
            { new: true, select: 'openedCount reflectionsCount prayerInteractionsCount' }
        );

        if (!updated) return res.status(404).json({ message: 'Fellowship not found' });
        res.json({ success: true, stats: updated });
    } catch (err) {
        res.status(500).json({ message: 'Failed to record interaction' });
    }
};

// Overview metrics for the G3/G4 Spiritual Command Centre
export const getMinistryDashboardStats = async (req, res) => {
    try {
        await activateScheduled();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayFellowship = await Fellowship.findOne({
            status: 'PUBLISHED',
            date: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ publishedAt: -1 });

        const fallback = !todayFellowship
            ? await Fellowship.findOne({ status: 'PUBLISHED' }).sort({ publishedAt: -1 })
            : todayFellowship;

        const [publishedTotal, draftsTotal, scheduledTotal, upcomingList] = await Promise.all([
            Fellowship.countDocuments({ status: 'PUBLISHED' }),
            Fellowship.countDocuments({ status: 'DRAFT' }),
            Fellowship.countDocuments({ status: 'SCHEDULED' }),
            Fellowship.find({
                status: { $in: ['SCHEDULED', 'DRAFT'] },
                date: { $gte: startOfDay }
            }).sort({ date: 1 }).limit(4).lean()
        ]);

        res.json({
            todayFellowship: fallback,
            stats: {
                publishedTotal,
                draftsTotal,
                scheduledTotal,
                todayReach: fallback?.openedCount || 0,
                todayReflections: fallback?.reflectionsCount || 0,
                todayPrayers: fallback?.prayerInteractionsCount || 0
            },
            upcoming: upcomingList
        });
    } catch (err) {
        console.error('Error getting dashboard stats:', err);
        res.status(500).json({ message: 'Failed to load ministry dashboard stats' });
    }
};
