import Question from '../models/Question.js';
import QuestionResponse from '../models/QuestionResponse.js';
import Meeting from '../models/Meeting.js';
import SupportRequest from '../models/SupportRequest.js';

export const getQuestions = async (req, res) => {
    try {
        const { category, status, search } = req.query;
        const filter = {};

        if (category && category !== 'all') {
            filter.category = category.toUpperCase();
        }

        if (status && status !== 'all') {
            filter.status = status.toUpperCase();
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { text: regex },
                { skill: regex },
                { explanation: regex }
            ];
        }

        const questions = await Question.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Attach quick analytics summaries
        const enhanced = await Promise.all(questions.map(async q => {
            const totalResponses = await QuestionResponse.countDocuments({ questionId: q._id });
            let correctRate = null;
            let checkInRequests = 0;

            if (q.category === 'SKILLS') {
                const correctCount = await QuestionResponse.countDocuments({ questionId: q._id, isCorrect: true });
                correctRate = totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;
            } else if (q.category === 'LIFE') {
                checkInRequests = await QuestionResponse.countDocuments({ questionId: q._id, requestCheckIn: true });
            }

            return {
                ...q,
                responseCount: totalResponses,
                correctRate,
                checkInRequests
            };
        }));

        res.json(enhanced);
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ message: 'Failed to fetch question bank' });
    }
};

export const getActiveDailyQuestion = async (req, res) => {
    try {
        const { meetingCode, meetingId } = req.query;

        // 1. If meetingCode or meetingId provided, check if meeting has question
        if (meetingCode || meetingId) {
            const query = meetingCode ? { code: meetingCode } : { _id: meetingId };
            const meeting = await Meeting.findOne(query).lean();
            if (meeting && meeting.questionOfDay && meeting.questionOfDay.trim()) {
                // Check if a linked Question entity exists or find matching by text
                let question = await Question.findOne({
                    $or: [
                        { meetingId: meeting._id },
                        { text: meeting.questionOfDay.trim() }
                    ]
                });

                if (!question) {
                    // Automatically provision Question entity with category heuristics
                    let cat = 'BANTER';
                    const qLower = meeting.questionOfDay.toLowerCase();
                    if (qLower.includes('knot') || qLower.includes('carabiner') || qLower.includes('rope') || qLower.includes('safety') || qLower.includes('drill')) {
                        cat = 'SKILLS';
                    } else if (qLower.includes('feel') || qLower.includes('pray') || qLower.includes('heart') || qLower.includes('struggle') || qLower.includes('grateful') || qLower.includes('life')) {
                        cat = 'LIFE';
                    }

                    question = new Question({
                        text: meeting.questionOfDay.trim(),
                        category: cat,
                        responseType: meeting.questionType || 'text',
                        options: meeting.questionOptions || [],
                        visibility: cat === 'LIFE' ? 'PRIVATE' : 'COMMUNITY',
                        meetingId: meeting._id,
                        status: 'ACTIVE'
                    });
                    await question.save();
                }

                return res.json(question);
            }
        }

        // 2. Default: Find the latest active question
        const latestQuestion = await Question.findOne({ status: 'ACTIVE' }).sort({ createdAt: -1 });
        res.json(latestQuestion || null);
    } catch (err) {
        console.error('Error fetching active question:', err);
        res.status(500).json({ message: 'Failed to resolve active daily question' });
    }
};

export const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        res.json(question);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving question' });
    }
};

export const createQuestion = async (req, res) => {
    try {
        const {
            text,
            category,
            responseType,
            options,
            visibility,
            required,
            skill,
            difficulty,
            correctAnswer,
            explanation,
            status,
            meetingId
        } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Question prompt text is required' });
        }

        const cat = (category || 'BANTER').toUpperCase();
        let defaultVis = 'COMMUNITY';
        if (cat === 'LIFE') defaultVis = 'PRIVATE';
        if (cat === 'SKILLS') defaultVis = 'TRAINER';

        const question = new Question({
            text: text.trim(),
            category: cat,
            responseType: responseType || 'text',
            options: options || [],
            visibility: visibility || defaultVis,
            required: !!required,
            skill: skill || '',
            difficulty: difficulty || '',
            correctAnswer: correctAnswer ? correctAnswer.trim() : '',
            explanation: explanation ? explanation.trim() : '',
            status: status || 'ACTIVE',
            meetingId: meetingId || null,
            createdBy: req.user?.username || 'Spiritual Coordinator'
        });

        await question.save();
        res.status(201).json(question);
    } catch (err) {
        console.error('Error creating question:', err);
        res.status(400).json({ message: err.message || 'Failed to create question' });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        const allowedFields = [
            'text', 'category', 'responseType', 'options', 'visibility',
            'required', 'skill', 'difficulty', 'correctAnswer', 'explanation',
            'status', 'meetingId'
        ];

        allowedFields.forEach(f => {
            if (req.body[f] !== undefined) {
                question[f] = req.body[f];
            }
        });

        await question.save();
        res.json(question);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update question' });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        await QuestionResponse.deleteMany({ questionId: req.params.id });
        res.json({ message: 'Question and associated responses removed' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete question' });
    }
};

// Response Submission with Auto-Grading for Skills
export const submitQuestionResponse = async (req, res) => {
    try {
        const {
            questionId,
            memberId,
            memberName,
            campus,
            memberType,
            meetingId,
            attendanceId,
            response,
            requestCheckIn,
            checkInReason
        } = req.body;

        if (!questionId || !memberId || response === undefined || response === null) {
            return res.status(400).json({ message: 'questionId, memberId, and response are required' });
        }

        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        // Evaluate skills correctness if applicable
        let isCorrect = null;
        if (question.category === 'SKILLS' && question.correctAnswer) {
            const cleanUser = String(response).trim().toLowerCase();
            const cleanExpected = String(question.correctAnswer).trim().toLowerCase();
            isCorrect = cleanUser === cleanExpected;
        }

        // Upsert response to prevent duplicate records
        const filter = {
            questionId,
            memberId,
            meetingId: meetingId || null
        };

        const updateData = {
            questionId,
            memberId,
            memberName: memberName || 'Member',
            campus: campus || 'Athi River',
            memberType: memberType || 'Douloid',
            meetingId: meetingId || null,
            attendanceId: attendanceId || null,
            category: question.category,
            response,
            isCorrect,
            requestCheckIn: !!requestCheckIn,
            checkInReason: checkInReason || '',
            visibility: question.visibility,
            submittedAt: new Date()
        };

        const savedResponse = await QuestionResponse.findOneAndUpdate(
            filter,
            updateData,
            { upsert: true, new: true }
        );

        // Update total response counter on question
        const total = await QuestionResponse.countDocuments({ questionId });
        question.responseCount = total;
        await question.save();

        // Auto-create pastoral support request if member requested check-in
        if (savedResponse.requestCheckIn) {
            try {
                await SupportRequest.create({
                    memberId,
                    memberName: memberName || 'Member',
                    campus: campus || 'Athi River',
                    memberType: memberType || 'Douloid',
                    reason: checkInReason && checkInReason.trim()
                        ? `Check-In Request: ${checkInReason.trim()}`
                        : `Pastoral check-in requested on "${question.text.substring(0, 50)}..."`,
                    details: `Response to "${question.text}": ${response}. Notes: ${checkInReason || 'None'}`,
                    source: 'QUESTION_CHECK_IN',
                    questionResponseId: savedResponse._id,
                    status: 'NEEDS_ATTENTION'
                });
            } catch (supportErr) {
                console.error('Error auto-creating support request from check-in:', supportErr);
            }
        }

        res.json({
            success: true,
            responseId: savedResponse._id,
            category: question.category,
            isCorrect,
            correctAnswer: question.correctAnswer || null,
            explanation: question.explanation || null,
            requestCheckIn: savedResponse.requestCheckIn
        });
    } catch (err) {
        console.error('Error submitting question response:', err);
        res.status(500).json({ message: 'Failed to record response' });
    }
};

// Response Analytics & Aggregate Insights (Non-invasive)
export const getQuestionAnalytics = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id).lean();
        if (!question) return res.status(404).json({ message: 'Question not found' });

        const responses = await QuestionResponse.find({ questionId: question._id }).lean();
        const total = responses.length;

        const analytics = {
            questionId: question._id,
            text: question.text,
            category: question.category,
            responseType: question.responseType,
            visibility: question.visibility,
            totalResponses: total,
            distribution: {},
            skillsAccuracy: null,
            checkInsRequested: 0
        };

        if (question.category === 'SKILLS') {
            const correctCount = responses.filter(r => r.isCorrect === true).length;
            const incorrectCount = responses.filter(r => r.isCorrect === false).length;
            analytics.skillsAccuracy = {
                correctCount,
                incorrectCount,
                accuracyRate: total > 0 ? Math.round((correctCount / total) * 100) : 0,
                difficulty: question.difficulty,
                explanation: question.explanation
            };
        }

        if (question.category === 'LIFE') {
            analytics.checkInsRequested = responses.filter(r => r.requestCheckIn === true).length;
        }

        // Choice/Option Distribution for multiple choice, yes/no, rating, checkboxes
        if (['multiple_choice', 'yes_no', 'rating', 'checkboxes'].includes(question.responseType)) {
            const counts = {};
            responses.forEach(r => {
                const val = String(r.response || '').trim();
                if (val) {
                    counts[val] = (counts[val] || 0) + 1;
                }
            });

            analytics.distribution = Object.keys(counts).map(opt => ({
                option: opt,
                count: counts[opt],
                percent: total > 0 ? Math.round((counts[opt] / total) * 100) : 0
            }));
        }

        res.json(analytics);
    } catch (err) {
        console.error('Error calculating question analytics:', err);
        res.status(500).json({ message: 'Failed to calculate analytics' });
    }
};

// Permission-guarded responses inspector
export const getQuestionResponses = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        // Privacy rule: G3/G4 only sees anonymous or consent-permitted items for Life questions
        const filter = { questionId: question._id };
        let projection = '-__v';

        if (question.category === 'LIFE') {
            // For life questions, show check-in reason only if requested
            const responses = await QuestionResponse.find(filter)
                .sort({ submittedAt: -1 })
                .select(projection)
                .lean();

            // Mask member identity for ordinary private life reflections unless check-in is requested
            const sanitized = responses.map(r => {
                if (r.requestCheckIn) {
                    return r; // Permitted for pastoral follow-up
                }
                return {
                    _id: r._id,
                    category: r.category,
                    response: r.response,
                    campus: r.campus,
                    submittedAt: r.submittedAt,
                    requestCheckIn: false,
                    memberId: 'Protected (Private)',
                    memberName: 'Anonymous Reflection'
                };
            });

            return res.json(sanitized);
        }

        const responses = await QuestionResponse.find(filter)
            .sort({ submittedAt: -1 })
            .select(projection)
            .lean();

        res.json(responses);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch responses' });
    }
};
