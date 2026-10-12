import React, { useState, useEffect } from 'react';
import {
    Lightbulb,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    X,
    Eye,
    Edit,
    Copy,
    Archive,
    HelpCircle,
    Star,
    Layers,
    ShieldAlert
} from 'lucide-react';

const G5QuestionBankWorkspace = ({
    api,
    showToast
}) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL', 'BANTER', 'SKILLS', 'LIFE'
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [responsesData, setResponsesData] = useState([]);
    const [responsesLoading, setResponsesLoading] = useState(false);

    // Form state
    const [form, setForm] = useState({
        text: '',
        category: 'SKILLS',
        responseType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        skill: 'Wilderness Safety',
        difficulty: 'Intermediate',
        required: true,
        visibility: 'TRAINER'
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = {};
            if (categoryFilter !== 'ALL') params.category = categoryFilter;
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const res = await api.get('/questions', { params });
            setQuestions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load questions:', err);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [categoryFilter]);

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        if (!form.text.trim()) {
            showToast?.('Please enter question text', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const cleanOptions = form.options.filter(o => o.trim());
            const payload = {
                text: form.text.trim(),
                category: form.category,
                responseType: form.responseType,
                options: cleanOptions,
                correctAnswer: form.correctAnswer.trim(),
                explanation: form.explanation.trim(),
                skill: form.skill.trim(),
                difficulty: form.difficulty,
                required: form.required,
                visibility: form.visibility,
                status: 'PUBLISHED'
            };

            await api.post('/questions', payload);
            showToast?.('Question created and published to Question Bank', 'success');
            setShowCreateModal(false);
            setForm({
                text: '',
                category: 'SKILLS',
                responseType: 'multiple_choice',
                options: ['', '', '', ''],
                correctAnswer: '',
                explanation: '',
                skill: 'Wilderness Safety',
                difficulty: 'Intermediate',
                required: true,
                visibility: 'TRAINER'
            });
            fetchQuestions();
        } catch (err) {
            console.error('Failed to create question:', err);
            showToast?.(err.response?.data?.message || 'Failed to save question', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewResponses = async (q) => {
        setSelectedQuestion(q);
        setResponsesLoading(true);
        try {
            const res = await api.get(`/questions/${q._id}/responses`);
            setResponsesData(res.data || []);
        } catch (err) {
            console.error('Failed to fetch responses:', err);
            if (q.category === 'LIFE') {
                showToast?.('Private Life responses are confidential and restricted from Training view', 'warning');
            }
            setResponsesData([]);
        } finally {
            setResponsesLoading(false);
        }
    };

    return (
        <div className="g5-question-bank-workspace">
            {/* WORKSPACE HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                        Question Bank & Knowledge Checks
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                        Reusable Question of the Day engine for drill attendance, skill evaluations, and feedback
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                            style={{
                                padding: '0.45rem 0.85rem 0.45rem 2rem',
                                borderRadius: '10px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.84rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="g5-btn-blue-solid"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem' }}
                    >
                        <Plus size={16} /> + Create Question
                    </button>
                </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="g5-subtab-bar">
                {[
                    { key: 'ALL', label: 'All Questions' },
                    { key: 'SKILLS', label: 'Skills & Safety Knowledge' },
                    { key: 'BANTER', label: 'Banter & Community' },
                    { key: 'LIFE', label: 'Life & Personal Reflection' }
                ].map(t => (
                    <button
                        key={t.key}
                        className={`g5-subtab-btn ${categoryFilter === t.key ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* QUESTIONS GRID */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Loading Question Bank...</div>
            ) : questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <Lightbulb size={40} style={{ color: '#94A3B8', marginBottom: '0.85rem' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>No questions found</h3>
                    <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '380px', margin: '0.4rem auto 1.25rem' }}>
                        Create a question to attach to trainings, camps, or meeting check-ins.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="g5-btn-blue-solid"
                        style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', fontWeight: 700 }}
                    >
                        <Plus size={15} /> Create Question
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                    {questions.map(q => {
                        return (
                            <div key={q._id} className="g5-question-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <span className={`g5-chip ${q.category === 'SKILLS' ? 'g5-chip-upcoming' : q.category === 'LIFE' ? 'g5-chip-attention' : 'g5-chip-draft'}`}>
                                                {q.category}
                                            </span>
                                            {q.difficulty && (
                                                <span className="g5-chip g5-chip-draft">
                                                    {q.difficulty}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
                                            {q.status || 'PUBLISHED'}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.65rem', lineHeight: 1.4 }}>
                                        {q.text}
                                    </h3>

                                    {q.skill && (
                                        <div style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 700, marginBottom: '0.65rem' }}>
                                            Skill: {q.skill}
                                        </div>
                                    )}

                                    {q.category === 'SKILLS' && q.correctAnswer && (
                                        <div style={{ fontSize: '0.8rem', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.5rem 0.75rem', borderRadius: '8px', color: '#166534', marginBottom: '0.75rem' }}>
                                            <strong>Correct:</strong> {q.correctAnswer}
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: '1rem', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '0.85rem', fontSize: '0.8rem' }}>
                                        <div>
                                            <span style={{ color: '#64748B' }}>Responses: </span>
                                            <strong style={{ color: '#0F172A' }}>{q.responseCount ?? 0}</strong>
                                        </div>
                                        {q.correctRate !== null && q.correctRate !== undefined && (
                                            <div>
                                                <span style={{ color: '#64748B' }}>Correct Rate: </span>
                                                <strong style={{ color: '#059669' }}>{q.correctRate}%</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleViewResponses(q)}
                                        style={{
                                            flex: 1,
                                            background: '#EFF6FF',
                                            border: '1px solid #BFDBFE',
                                            color: '#1D4ED8',
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem'
                                        }}
                                    >
                                        <Eye size={14} /> View Responses
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CREATE QUESTION MODAL */}
            {showCreateModal && (
                <div className="g5-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="g5-modal-window" onClick={e => e.stopPropagation()}>
                        <div className="g5-modal-header">
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                                    Create Question of the Day
                                </h3>
                                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                                    Save to Question Bank for reusable training & attendance verification
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateQuestion}>
                            <div className="g5-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                        Question Text *
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.text}
                                        onChange={e => setForm({ ...form, text: e.target.value })}
                                        placeholder="e.g. What should you do first during a severe weather shutdown on the high ropes course?"
                                        required
                                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                            Category *
                                        </label>
                                        <select
                                            value={form.category}
                                            onChange={e => setForm({ ...form, category: e.target.value })}
                                            style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                        >
                                            <option value="SKILLS">Skills (Training / Knowledge)</option>
                                            <option value="BANTER">Banter (Community / Icebreaker)</option>
                                            <option value="LIFE">Life (Personal Reflection)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                            Response Type *
                                        </label>
                                        <select
                                            value={form.responseType}
                                            onChange={e => setForm({ ...form, responseType: e.target.value })}
                                            style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                        >
                                            <option value="multiple_choice">Single Choice (Multiple Options)</option>
                                            <option value="checkboxes">Checkboxes (Multiple Answers)</option>
                                            <option value="yes_no">Yes / No</option>
                                            <option value="text">Open Text</option>
                                            <option value="rating">1–5 Star Rating</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Dynamic Options for Single Choice or Checkboxes */}
                                {['multiple_choice', 'checkboxes'].includes(form.responseType) && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                            Options
                                        </label>
                                        {form.options.map((opt, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.45rem' }}>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...form.options];
                                                        newOpts[idx] = e.target.value;
                                                        setForm({ ...form, options: newOpts });
                                                    }}
                                                    placeholder={`Option ${idx + 1}`}
                                                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Skills specifics */}
                                {form.category === 'SKILLS' && (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                                    Correct Answer
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.correctAnswer}
                                                    onChange={e => setForm({ ...form, correctAnswer: e.target.value })}
                                                    placeholder="Must match the correct option exactly"
                                                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                                    Skill Tag & Difficulty
                                                </label>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        value={form.skill}
                                                        onChange={e => setForm({ ...form, skill: e.target.value })}
                                                        placeholder="e.g. High Ropes"
                                                        style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                                    />
                                                    <select
                                                        value={form.difficulty}
                                                        onChange={e => setForm({ ...form, difficulty: e.target.value })}
                                                        style={{ padding: '0.55rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="Beginner">Beginner</option>
                                                        <option value="Intermediate">Intermediate</option>
                                                        <option value="Advanced">Advanced</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                                                Explanation & SOP Reference
                                            </label>
                                            <input
                                                type="text"
                                                value={form.explanation}
                                                onChange={e => setForm({ ...form, explanation: e.target.value })}
                                                placeholder="e.g. Under LOP-03, mandatory immediate clearance."
                                                style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="g5-modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="g5-btn-blue-solid"
                                    style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 800 }}
                                >
                                    {submitting ? 'Publishing...' : 'Publish Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW RESPONSES MODAL */}
            {selectedQuestion && (
                <div className="g5-modal-overlay" onClick={() => setSelectedQuestion(null)}>
                    <div className="g5-modal-window" onClick={e => e.stopPropagation()}>
                        <div className="g5-modal-header">
                            <div>
                                <span className="g5-chip g5-chip-upcoming">{selectedQuestion.category}</span>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.35rem 0 0', color: '#0F172A' }}>
                                    Responses: {selectedQuestion.text}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedQuestion(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="g5-modal-body">
                            {selectedQuestion.category === 'LIFE' ? (
                                <div style={{ padding: '1.25rem', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <ShieldAlert size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <h4 style={{ margin: '0 0 0.3rem', fontSize: '0.95rem', fontWeight: 800, color: '#92400E' }}>
                                            Confidential Pastoral Data Protected
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#B45309', lineHeight: 1.5 }}>
                                            Under Doulos Privacy Protocol, personal spiritual and life reflections are protected. G5 Training Directorate does not view private personal spiritual disclosures.
                                        </p>
                                    </div>
                                </div>
                            ) : responsesLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading responses...</div>
                            ) : responsesData.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                                    No responses recorded yet for this question.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {responsesData.map((r, i) => (
                                        <div key={i} style={{ padding: '0.75rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
                                                    {r.memberName || 'Student'} ({r.campus || 'Campus'})
                                                </div>
                                                <div style={{ fontSize: '0.84rem', color: '#334155', marginTop: '0.15rem' }}>
                                                    {r.response}
                                                </div>
                                            </div>
                                            {r.isCorrect !== undefined && (
                                                <span className={`g5-chip ${r.isCorrect ? 'g5-chip-active' : 'g5-chip-critical'}`}>
                                                    {r.isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="g5-modal-footer">
                            <button
                                type="button"
                                onClick={() => setSelectedQuestion(null)}
                                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default G5QuestionBankWorkspace;
