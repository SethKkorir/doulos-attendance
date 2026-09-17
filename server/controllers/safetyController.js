import LopDoc from '../models/LopDoc.js';
import IncidentLog from '../models/IncidentLog.js';

// 1. Get LOP Documents
export const getLopDocs = async (req, res) => {
    try {
        const { category } = req.query;
        const query = {};
        if (category && category !== 'All') {
            query.category = category;
        }

        const docs = await LopDoc.find(query).sort({ category: 1, title: 1 });
        res.json({ success: true, count: docs.length, docs });
    } catch (err) {
        console.error('Error fetching LOP docs:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 2. Get Incident Logs
export const getIncidents = async (req, res) => {
    try {
        const { campus, severity } = req.query;
        const query = {};
        if (campus && campus !== 'All') query.campus = campus;
        if (severity && severity !== 'All') query.severity = severity;

        const incidents = await IncidentLog.find(query).sort({ incidentDate: -1, createdAt: -1 });
        res.json({ success: true, count: incidents.length, incidents });
    } catch (err) {
        console.error('Error fetching incidents:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// 3. Report Safety Incident
export const reportIncident = async (req, res) => {
    try {
        const {
            title,
            severity,
            location,
            campus,
            description,
            correctiveActionPlan,
            rootCauseAnalysis,
            equipmentInvolved,
            involvedParties
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required' });
        }

        const incident = new IncidentLog({
            title: title.trim(),
            severity: severity || 'Near-Miss',
            location: location || 'Freedom Base',
            campus: campus || 'Freedom Base',
            description: description.trim(),
            correctiveActionPlan: correctiveActionPlan || 'Review protocols with team',
            rootCauseAnalysis: rootCauseAnalysis || 'Under operational safety review',
            equipmentInvolved: equipmentInvolved || '',
            involvedParties: involvedParties || [{ name: req.user?.username || 'G5 Trainer', roleOrRank: 'Staff' }],
            investigator: req.user?.username || 'G5 Training Directorate'
        });

        await incident.save();

        res.status(201).json({
            success: true,
            message: `Safety incident report logged: ${incident.title}`,
            incident
        });
    } catch (err) {
        console.error('Error reporting incident:', err);
        res.status(500).json({ success: false, message: 'Server error logging incident', error: err.message });
    }
};
