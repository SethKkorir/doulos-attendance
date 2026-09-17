import React, { useState } from 'react';
import { X, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { PrimaryButton, OutlineButton } from './Buttons';

/**
 * AddRecruitModal: Fast one-screen recruit intake form.
 * Inputs: Full Name, Admission Number, Campus, Phone Number.
 * Adds directly to MongoDB and immediately refreshes table without page reload.
 */
export default function AddRecruitModal({ isOpen, onClose, onMemberAdded, api, setMsg, isGuest }) {
    const [formData, setFormData] = useState({
        name: '',
        studentRegNo: '',
        campus: 'Athi River',
        memberType: 'Douloid',
        douloidRank: 'None',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleRegNoChange = (e) => {
        const v = e.target.value.toUpperCase();
        setFormData(prev => ({ ...prev, studentRegNo: v }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isGuest) {
            setMsg?.({ type: 'error', text: 'Action disabled in Guest Mode.' });
            return;
        }

        if (!formData.name.trim() || !formData.studentRegNo.trim()) {
            setError('Please provide both Full Name and Admission Number.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                name: formData.name.trim(),
                studentRegNo: formData.studentRegNo.trim().toUpperCase(),
                campus: formData.campus,
                memberType: formData.memberType,
                douloidRank: formData.douloidRank,
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                status: 'Active'
            };

            const res = await api.post('/members', payload);
            setMsg?.({ type: 'success', text: `Member ${payload.name.split(' ')[0]} added to register!` });
            
            // Callback to update parent table immediately without full reload
            if (onMemberAdded) {
                onMemberAdded(res.data);
            }
            
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add recruit. Please check details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(46, 42, 77, 0.45)',
                backdropFilter: 'blur(5px)',
                zIndex: 1100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-card, 16px)',
                    boxShadow: '0 16px 40px rgba(46, 42, 77, 0.2)',
                    width: '100%',
                    maxWidth: '460px',
                    padding: '2rem',
                    boxSizing: 'border-box',
                    animation: 'popScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--color-sidebar-active-bg, #DCD6F7)',
                                color: 'var(--color-sidebar-bg, #4B3F8C)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <UserPlus size={22} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#2D2D3A', letterSpacing: '-0.01em' }}>
                                Register Member / Recruit
                            </h3>
                            <span style={{ fontSize: '0.76rem', color: '#8E8B9F', fontWeight: 500 }}>
                                One-screen intake: Full Name, Admission Number, Campus, Category & Rank
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F6F6F9',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#6B6882'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FCA5A5',
                            borderRadius: '10px',
                            color: '#B91C1C',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1.25rem'
                        }}
                    >
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    {/* Full Name */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A4560', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                            Full Name <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Eric Dyer"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 1rem',
                                borderRadius: '10px',
                                border: '1.5px solid #E5E5EB',
                                fontSize: '0.88rem',
                                color: '#2D2D3A',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Admission Number */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A4560', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                            Admission Number (Reg No) <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 24-0578 or 21-1234"
                            value={formData.studentRegNo}
                            onChange={handleRegNoChange}
                            maxLength={30}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 1rem',
                                borderRadius: '10px',
                                border: '1.5px solid #E5E5EB',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                letterSpacing: '1px',
                                color: '#2D2D3A',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Campus */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A4560', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                            Campus <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {['Athi River', 'Valley Road'].map(camp => (
                                <button
                                    type="button"
                                    key={camp}
                                    onClick={() => setFormData({ ...formData, campus: camp })}
                                    style={{
                                        height: '42px',
                                        borderRadius: '10px',
                                        border: `1.5px solid ${formData.campus === camp ? '#4B3F8C' : '#E5E5EB'}`,
                                        backgroundColor: formData.campus === camp ? '#F1EFFF' : '#FFFFFF',
                                        color: formData.campus === camp ? '#4B3F8C' : '#4A4560',
                                        fontWeight: 700,
                                        fontSize: '0.84rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {camp}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Member Category & Douloid Rank */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A4560', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                                Category <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <select
                                value={formData.memberType}
                                onChange={e => setFormData({ ...formData, memberType: e.target.value })}
                                style={{
                                    width: '100%',
                                    height: '42px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #E5E5EB',
                                    padding: '0 0.75rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: '#2D2D3A',
                                    backgroundColor: '#FFFFFF'
                                }}
                            >
                                <option value="Douloid">Douloid (Facilitator)</option>
                                <option value="Recruit">Recruit</option>
                                <option value="Visitor">Visitor</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A4560', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                                Initial Rank
                            </label>
                            <select
                                value={formData.douloidRank}
                                onChange={e => setFormData({ ...formData, douloidRank: e.target.value })}
                                style={{
                                    width: '100%',
                                    height: '42px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #E5E5EB',
                                    padding: '0 0.75rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: '#2D2D3A',
                                    backgroundColor: '#FFFFFF'
                                }}
                            >
                                <option value="None">None</option>
                                <option value="Shadow Douloid">Shadow Douloid</option>
                                <option value="Basic Douloid">Basic Douloid</option>
                                <option value="Intermediate Douloid">Intermediate Douloid</option>
                                <option value="Lead Douloid">Lead Douloid</option>
                            </select>
                        </div>
                    </div>

                    {/* Phone & Email Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A4560', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                                Mobile / Phone
                            </label>
                            <input
                                type="tel"
                                placeholder="+254 7..."
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    padding: '0 0.85rem',
                                    borderRadius: '10px',
                                    border: '1.5px solid #E5E5EB',
                                    fontSize: '0.85rem',
                                    color: '#2D2D3A',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4A4560', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="name@email.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    padding: '0 0.85rem',
                                    borderRadius: '10px',
                                    border: '1.5px solid #E5E5EB',
                                    fontSize: '0.85rem',
                                    color: '#2D2D3A',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #EBEBF2' }}>
                        <OutlineButton
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </OutlineButton>
                        <PrimaryButton
                            type="submit"
                            disabled={loading}
                            style={{ flex: 1.5 }}
                        >
                            {loading ? 'Adding Recruit...' : 'Add Recruit'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
