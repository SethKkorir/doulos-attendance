import SupportRequest from '../models/SupportRequest.js';

// Create a new direct support request (Member app or coordinator entry)
export const createSupportRequest = async (req, res) => {
    try {
        const {
            memberId,
            memberName,
            campus,
            memberType,
            reason,
            details,
            preferredContactMethod,
            priority,
            source
        } = req.body;

        if (!memberId || !reason || !reason.trim()) {
            return res.status(400).json({ message: 'memberId and reason are required' });
        }

        const request = new SupportRequest({
            memberId: memberId.trim(),
            memberName: memberName || 'Member',
            campus: campus || 'Athi River',
            memberType: memberType || 'Douloid',
            reason: reason.trim(),
            details: details ? details.trim() : '',
            preferredContactMethod: preferredContactMethod || 'In Person',
            priority: priority || 'NORMAL',
            source: source || 'DIRECT_REQUEST',
            status: 'NEEDS_ATTENTION',
            requestedAt: new Date()
        });

        await request.save();
        res.status(201).json(request);
    } catch (err) {
        console.error('Error creating support request:', err);
        res.status(500).json({ message: 'Failed to create support request' });
    }
};

// Get list of support requests with filters for G3/G4 dashboard
export const getSupportRequests = async (req, res) => {
    try {
        const { status, campus, priority, assignedTo, search } = req.query;

        const filter = {};

        if (status && status !== 'ALL') {
            if (status === 'ACTIVE') {
                filter.status = { $in: ['NEEDS_ATTENTION', 'ASSIGNED', 'IN_PROGRESS'] };
            } else {
                filter.status = status;
            }
        }

        if (campus && campus !== 'ALL') {
            filter.campus = campus;
        }

        if (priority && priority !== 'ALL') {
            filter.priority = priority;
        }

        if (assignedTo) {
            if (assignedTo === 'UNASSIGNED') {
                filter.$or = [{ assignedTo: null }, { assignedTo: '' }];
            } else {
                filter.assignedTo = assignedTo;
            }
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { memberName: regex },
                { memberId: regex },
                { reason: regex },
                { details: regex }
            ];
        }

        const requests = await SupportRequest.find(filter)
            .sort({ priority: -1, requestedAt: -1 })
            .lean();

        res.json(requests);
    } catch (err) {
        console.error('Error querying support requests:', err);
        res.status(500).json({ message: 'Failed to fetch support requests' });
    }
};

// Summary metrics for Care board header
export const getSupportRequestStats = async (req, res) => {
    try {
        const { campus } = req.query;
        const filter = {};
        if (campus && campus !== 'ALL') {
            filter.campus = campus;
        }

        const total = await SupportRequest.countDocuments(filter);
        const needsAttention = await SupportRequest.countDocuments({ ...filter, status: 'NEEDS_ATTENTION' });
        const inProgress = await SupportRequest.countDocuments({
            ...filter,
            status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
        });
        const resolved = await SupportRequest.countDocuments({
            ...filter,
            status: { $in: ['RESOLVED', 'CLOSED'] }
        });
        const urgent = await SupportRequest.countDocuments({
            ...filter,
            priority: 'URGENT',
            status: { $ne: 'RESOLVED' }
        });

        res.json({
            total,
            needsAttention,
            inProgress,
            resolved,
            urgent
        });
    } catch (err) {
        console.error('Error fetching support request stats:', err);
        res.status(500).json({ message: 'Failed to compute support stats' });
    }
};

// Get single support request details
export const getSupportRequestById = async (req, res) => {
    try {
        const request = await SupportRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve support request' });
    }
};

// Update request status, assignee, priority
export const updateSupportRequest = async (req, res) => {
    try {
        const request = await SupportRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        const allowedFields = ['status', 'assignedTo', 'priority', 'details', 'reason'];
        allowedFields.forEach(f => {
            if (req.body[f] !== undefined) {
                request[f] = req.body[f];
            }
        });

        if (req.body.status === 'RESOLVED' && !request.resolvedAt) {
            request.resolvedAt = new Date();
        } else if (req.body.status !== 'RESOLVED' && req.body.status !== 'CLOSED') {
            request.resolvedAt = null;
        }

        await request.save();
        res.json(request);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update support request' });
    }
};

// Add confidential pastoral care note
export const addSupportRequestNote = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Note content is required' });
        }

        const request = await SupportRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        const author = req.user?.username || 'Spiritual Coordinator';

        request.notes.push({
            text: text.trim(),
            author,
            createdAt: new Date()
        });

        // Automatically move to IN_PROGRESS if previously unaddressed
        if (request.status === 'NEEDS_ATTENTION') {
            request.status = 'IN_PROGRESS';
            if (!request.assignedTo) {
                request.assignedTo = author;
            }
        }

        await request.save();
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: 'Failed to append pastoral note' });
    }
};
