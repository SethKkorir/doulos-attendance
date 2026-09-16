import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { PrimaryButton, OutlineButton } from './Buttons';

/**
 * FilterPanel: Slide-out drawer or modal to filter members by Campus, Rank, Status, and Semester.
 */
export default function FilterPanel({
    isOpen,
    onClose,
    campusFilter,
    setCampusFilter,
    rankFilter,
    setRankFilter,
    statusFilter,
    setStatusFilter,
    showAllSemesters,
    setShowAllSemesters,
    onReset
}) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(46, 42, 77, 0.45)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'flex-end',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '380px',
                    maxWidth: '90vw',
                    height: '100%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '-8px 0 32px rgba(46, 42, 77, 0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem 1.75rem',
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', borderBottom: '1px solid #EBEBF2', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#F1EFFF', color: '#4B3F8C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Filter size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#2D2D3A' }}>Filter Register</h3>
                            <span style={{ fontSize: '0.74rem', color: '#8E8B9F', fontWeight: 500 }}>Refine visible member rows</span>
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
                            color: '#6B6882',
                            transition: 'all 0.15s'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Filter Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                    {/* Campus */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                            Campus
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {['All', 'Athi River', 'Valley Road'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCampusFilter(c)}
                                    style={{
                                        padding: '0.55rem 0.5rem',
                                        borderRadius: '8px',
                                        border: `1.5px solid ${campusFilter === c ? '#4B3F8C' : '#E5E5EB'}`,
                                        backgroundColor: campusFilter === c ? '#F1EFFF' : '#FFFFFF',
                                        color: campusFilter === c ? '#4B3F8C' : '#4A4560',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        textAlign: 'center'
                                    }}
                                >
                                    {c === 'Valley Road' ? 'VR' : c === 'Athi River' ? 'Athi' : 'All'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Douloid Rank */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                            Douloid Rank
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {['All', 'Lead Douloid', 'Intermediate Douloid', 'Basic Douloid', 'Shadow Douloid', 'None'].map(r => (
                                <label
                                    key={r}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.65rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px',
                                        backgroundColor: rankFilter === r ? '#F8F8FD' : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.84rem',
                                        fontWeight: rankFilter === r ? 700 : 500,
                                        color: '#333145'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="rankFilter"
                                        checked={rankFilter === r}
                                        onChange={() => setRankFilter(r)}
                                        style={{ accentColor: '#4B3F8C' }}
                                    />
                                    {r === 'All' ? 'All Douloids' : r}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Member Status */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                            Member Status
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                            {['All', 'Active', 'Recruit', 'Inactive', 'Probation', 'Visitor'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    style={{
                                        padding: '0.45rem 0.85rem',
                                        borderRadius: 'var(--radius-pill, 999px)',
                                        border: `1.5px solid ${statusFilter === st ? '#4B3F8C' : '#E5E5EB'}`,
                                        backgroundColor: statusFilter === st ? '#F1EFFF' : '#FFFFFF',
                                        color: statusFilter === st ? '#4B3F8C' : '#4A4560',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Semester Scope */}
                    <div style={{ backgroundColor: '#F9FAFC', border: '1px solid #EBEBF2', borderRadius: '10px', padding: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={showAllSemesters}
                                onChange={e => setShowAllSemesters(e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: '#4B3F8C' }}
                            />
                            <div>
                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#2D2D3A', display: 'block' }}>Show All Semesters</span>
                                <span style={{ fontSize: '0.72rem', color: '#8E8B9F', display: 'block' }}>Include past alumni & inactive historical cohorts</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Footer buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #EBEBF2' }}>
                    <OutlineButton
                        icon={RotateCcw}
                        onClick={onReset}
                        style={{ flex: 1 }}
                    >
                        Reset
                    </OutlineButton>
                    <PrimaryButton
                        onClick={onClose}
                        style={{ flex: 1.5 }}
                    >
                        Apply Filters
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
