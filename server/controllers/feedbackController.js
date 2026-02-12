import Feedback from '../models/Feedback.js';

// Public: Submit new feedback
export const createFeedback = async (req, res) => {
    try {
        const { name, message, category } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required' });

        const newFeedback = new Feedback({
            name: name || 'Anonymous',
            message,
            category: category || 'general'
        });

        await newFeedback.save();
        res.status(201).json(newFeedback);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Private (Admin): Get all feedbacks
export const getFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Private (Admin): Update feedback status
export const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await Feedback.findByIdAndUpdate(
            id,
            { status },
            { new: true } // Return updated doc
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Private (Admin): Delete feedback
export const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        await Feedback.findByIdAndDelete(id);
        res.json({ message: 'Feedback deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
