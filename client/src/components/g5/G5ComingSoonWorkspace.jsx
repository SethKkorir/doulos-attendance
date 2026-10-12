import React, { useState } from 'react';
import {
    Lightbulb,
    Tent,
    Compass,
    Shield,
    ShieldAlert,
    FileText,
    Layers,
    CreditCard,
    Radio,
    Sparkles,
    Settings,
    ArrowLeft,
    Calendar,
    CalendarCheck,
    LayoutDashboard,
    Clock,
    CheckCircle2,
    Eye,
    X,
    Award,
    HeartHandshake
} from 'lucide-react';

const COMING_SOON_CONFIG = {
    minutes: {
        title: 'Executive Governance Minutes Vault',
        subtitle: 'Official repository of Council sessions, binding policy resolutions, and institutional directives.',
        icon: FileText,
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        category: 'GOVERNANCE & SECRETARIAT',
        badge: 'MINUTES VAULT',
        features: [
            'Digital Council Minutes Archival & Sealing',
            'Binding Policy Resolution Tracking',
            'Quorum Auditing & Formal Adjournment Logs'
        ]
    },
    transcripts: {
        title: 'Official Service Transcripts & Certificates',
        subtitle: 'G3-certified audit engine tracking member fellowship attendance, wilderness camps, and stewardship points.',
        icon: Award,
        iconBg: '#EEF2FF',
        iconColor: '#4F46E5',
        category: 'CERTIFICATIONS & AUDITS',
        badge: 'TRANSCRIPTS',
        features: [
            'Automated Service Hours & Fellowship Verification',
            'High-Res Sealed Printable Certificates',
            'Belay Master & Station Clearance Badging'
        ]
    },
    care: {
        title: 'Pastoral Care & Prayer Requests',
        subtitle: 'Confidential pastoral intercession, student counselling inquiries, and spiritual support triage.',
        icon: HeartHandshake,
        iconBg: '#FDF2F8',
        iconColor: '#DB2777',
        category: 'SPIRITUAL INTERCESSION',
        badge: 'PASTORAL CARE',
        features: [
            'Confidential Prayer & Triage Queues',
            'Case Assignment to Spiritual Mentors',
            'Pastoral Follow-Up Logs & Resolution History'
        ]
    },
    questions: {
        title: 'Question Bank & Knowledge Checks',
        subtitle: 'Curated knowledge verification, multi-choice question pools, and automated attendance checks.',
        icon: Lightbulb,
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        category: 'TRAINING & ASSESSMENT',
        badge: 'QUESTION BANK',
        features: [
            'Interactive Attendance Checks & Verification',
            'Categorized Question Pools (Skills / Life / Banter)',
            'Automated Scoring & Immediate Feedback'
        ]
    },
    camps: {
        title: 'Camps & Expedition Run Sheets',
        subtitle: 'Camp run sheet command studio, day-by-day itineraries, and Freedom Base camp rotations.',
        icon: Tent,
        iconBg: '#E0E7FF',
        iconColor: '#4338CA',
        category: 'FIELD EXPEDITIONS',
        badge: 'CAMPS',
        features: [
            'Lukenya & Freedom Base Run Sheets',
            'Station Rotations & Belay Master Sync',
            'Camp Schedule Timeline Visualizer'
        ]
    },
    trainings: {
        title: 'Training Curricula & Modules',
        subtitle: 'Standardized facilitator syllabi, station qualification tracks, and field drills.',
        icon: Compass,
        iconBg: '#EFF6FF',
        iconColor: '#2563EB',
        category: 'DIRECTORATE CURRICULA',
        badge: 'TRAINING',
        features: [
            'Challenge Course Operator Tracks',
            'Safety Rigging Drills & Checklists',
            'Peer Facilitator Assessments'
        ]
    },
    trainings_camps: {
        title: 'Training Curricula & Modules',
        subtitle: 'Standardized facilitator syllabi, station qualification tracks, and field drills.',
        icon: Compass,
        iconBg: '#EFF6FF',
        iconColor: '#2563EB',
        category: 'DIRECTORATE CURRICULA',
        badge: 'TRAINING',
        features: [
            'Challenge Course Operator Tracks',
            'Safety Rigging Drills & Checklists',
            'Peer Facilitator Assessments'
        ]
    },
    safety_centre: {
        title: 'Safety Centre & Incident Command',
        subtitle: 'Centralized safety oversight, field incident reporting, and real-time risk mitigations.',
        icon: Shield,
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        category: 'FIELD SAFETY & COMPLIANCE',
        badge: 'SAFETY CENTRE',
        features: [
            'Real-Time Field Incident Logging',
            'Wilderness Extrication Trees',
            'Course Weather Alert Dispersal Controls'
        ]
    },
    safety: {
        title: 'Safety Centre & Incident Command',
        subtitle: 'Centralized safety oversight, field incident reporting, and real-time risk mitigations.',
        icon: Shield,
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        category: 'FIELD SAFETY & COMPLIANCE',
        badge: 'SAFETY CENTRE',
        features: [
            'Real-Time Field Incident Logging',
            'Wilderness Extrication Trees',
            'Course Weather Alert Dispersal Controls'
        ]
    },
    incidents: {
        title: 'Incident Logs & Dispatches',
        subtitle: 'Track safety incidents, near-misses, and corrective actions across campuses.',
        icon: ShieldAlert,
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        category: 'INCIDENT LOGGING',
        badge: 'INCIDENTS',
        features: [
            'Direct Incident Dispatch Hotline',
            'Automated Severity Classification',
            'Post-Incident Review Workflow'
        ]
    },
    sops: {
        title: 'SOP & LOP Library',
        subtitle: 'Official Standard & Local Operating Procedures for high ropes, low ropes, and camp logistics.',
        icon: FileText,
        iconBg: '#F1F5F9',
        iconColor: '#475569',
        category: 'PROCEDURAL LIBRARY',
        badge: 'SOP / LOP',
        features: [
            'Certified Challenge Course SOPs',
            'Belay & Rigging Manuals',
            'Digital Sign-off & Acknowledgments'
        ]
    },
    gear: {
        title: 'Gear & Hardware Logistics',
        subtitle: 'Quartermaster gear tracking, carabiner & dynamic rope retirement schedules, and inspections.',
        icon: Layers,
        iconBg: '#F3E8FF',
        iconColor: '#7E22CE',
        category: 'OPERATIONS & ASSETS',
        badge: 'OPERATIONS',
        features: [
            'Serial-Numbered Hardware Registry',
            'Drop & Stress Retirement Counters',
            'Field Maintenance Dispatch'
        ]
    },
    contributions: {
        title: 'Operations & Contributions',
        subtitle: 'Monthly member dues, payment reconciliations, and operational allocations.',
        icon: CreditCard,
        iconBg: '#ECFDF5',
        iconColor: '#059669',
        category: 'OPERATIONAL FINANCE',
        badge: 'OPERATIONS',
        features: [
            'M-Pesa Ledger Reconciliation',
            'Directorate Requisition Sync',
            'Automated Statement Generation'
        ]
    },
    analytics: {
        title: 'Training Analytics & Velocity',
        subtitle: 'Cohort velocity, retention curves, campus breakdown, and facilitator growth metrics.',
        icon: Radio,
        iconBg: '#EFF6FF',
        iconColor: '#2563EB',
        category: 'REPORTS & INTELLIGENCE',
        badge: 'REPORTS',
        features: [
            'Cross-Campus Velocity Comparisons',
            'Recruit-to-Douloid Conversion Rates',
            'Predictive Attendance Forecasting'
        ]
    },
    readiness: {
        title: 'Readiness & Qualification Reports',
        subtitle: 'Comprehensive candidate readiness radars, belay authorization rosters, and reports.',
        icon: Sparkles,
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        category: 'REPORTS & INTELLIGENCE',
        badge: 'REPORTS',
        features: [
            'Individual Facilitator Competency Scores',
            'Station Operation Authorizations',
            'Exportable Directorate Briefings'
        ]
    },
    settings: {
        title: 'G5 Directorate Settings & Thresholds',
        subtitle: 'Configure automated readiness equations, attendance thresholds, and safety alerts.',
        icon: Settings,
        iconBg: '#F1F5F9',
        iconColor: '#334155',
        category: 'DIRECTORATE CONFIGURATION',
        badge: 'SETTINGS',
        features: [
            'Custom Absence Warning Limits',
            'Graduation Readiness Score Equations',
            'Automated Notification Triggers'
        ]
    }
};

export default function G5ComingSoonWorkspace({
    tabId,
    onNavigateTab,
    fallbackComponent = null
}) {
    const [devPreview, setDevPreview] = useState(false);
    const config = COMING_SOON_CONFIG[tabId] || {
        title: 'Feature Module',
        subtitle: 'This workspace is currently under active development for production deployment.',
        icon: Clock,
        iconBg: '#EFF6FF',
        iconColor: '#2563EB',
        category: 'DOULOS G5',
        badge: 'COMING SOON',
        features: ['Production Hardening', 'Directorate Testing', 'Upcoming Release']
    };

    const Icon = config.icon;

    if (devPreview && fallbackComponent) {
        return (
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 1rem',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    fontSize: '0.82rem',
                    color: '#92400E'
                }}>
                    <span>⚠️ <strong>Dev Preview Active</strong>: Viewing draft workspace. In production, members see Coming Soon.</span>
                    <button
                        type="button"
                        onClick={() => setDevPreview(false)}
                        style={{
                            background: '#FFFFFF',
                            border: '1px solid #D97706',
                            color: '#B45309',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                        }}
                    >
                        Switch to Coming Soon
                    </button>
                </div>
                {fallbackComponent}
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
            {/* Top Bar / Category Indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: 'rgba(217, 119, 6, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#D97706',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        letterSpacing: '0.6px',
                        textTransform: 'uppercase'
                    }}>
                        <Clock size={12} /> {config.badge} • COMING SOON
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {config.category}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={() => onNavigateTab?.('dashboard')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                            background: '#FFFFFF',
                            color: 'var(--color-text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <LayoutDashboard size={14} /> Back to Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigateTab?.('meetings')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'var(--color-primary, #1D4ED8)',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)'
                        }}
                    >
                        <Calendar size={14} /> View Meetings
                    </button>
                </div>
            </div>

            {/* Main Coming Soon Hero Card */}
            <div style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background decorative watermark */}
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    opacity: 0.04,
                    pointerEvents: 'none'
                }}>
                    <Icon size={260} />
                </div>

                <div style={{ maxWidth: '680px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: config.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.25rem',
                        boxShadow: `0 8px 20px ${config.iconBg}`
                    }}>
                        <Icon size={32} color={config.iconColor} />
                    </div>

                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 900,
                        color: 'var(--color-text-main, #0F172A)',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.4px'
                    }}>
                        {config.title}
                    </h2>

                    <p style={{
                        fontSize: '0.96rem',
                        lineHeight: 1.6,
                        color: 'var(--color-text-muted, #64748B)',
                        marginBottom: '1.75rem'
                    }}>
                        {config.subtitle} This workspace is currently undergoing directorate review and will be available in the upcoming production release.
                    </p>

                    {/* Planned Features List */}
                    <div style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--color-border)',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: '0.6px',
                            marginBottom: '0.85rem'
                        }}>
                            Planned Capabilities in Production Release:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {config.features.map((feat, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: '#EFF6FF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <CheckCircle2 size={13} color="#2563EB" />
                                    </div>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                                        {feat}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Action Navigation Grid */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => onNavigateTab?.('meetings')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'var(--color-primary, #1D4ED8)',
                                color: '#FFFFFF',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(29, 78, 216, 0.28)'
                            }}
                        >
                            <Calendar size={16} /> Open Field Meetings
                        </button>
                        <button
                            type="button"
                            onClick={() => onNavigateTab?.('attendance')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: '#FFFFFF',
                                color: 'var(--color-text-main, #0F172A)',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <CalendarCheck size={16} /> Attendance Ledger
                        </button>
                        <button
                            type="button"
                            onClick={() => onNavigateTab?.('dashboard')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '10px 18px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: '#F8FAFC',
                                color: '#64748B',
                                fontSize: '0.88rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <ArrowLeft size={15} /> Dashboard
                        </button>

                        {/* Optional dev preview link in dev environment */}
                        {import.meta.env.DEV && fallbackComponent && (
                            <button
                                type="button"
                                onClick={() => setDevPreview(true)}
                                style={{
                                    marginLeft: 'auto',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px dashed #CBD5E1',
                                    background: 'transparent',
                                    color: '#94A3B8',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <Eye size={12} /> Dev Preview Draft
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ComingSoonModal({ moduleKey, itemInfo, onClose }) {
    if (!moduleKey && !itemInfo) return null;
    const key = moduleKey || itemInfo?.key || itemInfo?.id;
    const config = (key && COMING_SOON_CONFIG[key]) || {
        title: itemInfo?.label || 'Coming Soon',
        subtitle: 'This module is currently undergoing final optimizations for production deployment.',
        icon: itemInfo?.icon || Clock,
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        category: 'DIRECTORATE ROADMAP',
        badge: 'COMING SOON',
        features: [
            'Full module workflows & management interfaces',
            'Integrated directorate synchronizations & reporting',
            'Real-time automated audit trails'
        ]
    };

    const IconComp = config.icon || Clock;

    return (
        <div
            className="g5-coming-soon-backdrop"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.72)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '1.25rem'
            }}
            onClick={onClose}
        >
            <div
                className="g5-coming-soon-popup"
                style={{
                    maxWidth: '460px',
                    width: '100%',
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '2rem 1.75rem',
                    boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
                    border: '1.5px solid #E2E8F0',
                    textAlign: 'center',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#F1F5F9',
                        color: '#64748B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                {/* Animated Icon Avatar */}
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '22px',
                    background: config.iconBg || '#FEF3C7',
                    border: `2px solid ${config.iconColor ? `${config.iconColor}33` : '#FCD34D'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: config.iconColor || '#D97706',
                    marginBottom: '1.25rem',
                    boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.08)'
                }}>
                    <IconComp size={36} />
                </div>

                {/* Status Badge */}
                <div style={{ marginBottom: '0.65rem' }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: 'rgba(217, 119, 6, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#B45309',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                    }}>
                        <Clock size={12} /> Under Active Development
                    </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {config.title || `${itemInfo?.label || 'Feature'} — Coming Soon`}
                </h3>

                {/* Subtitle */}
                <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: '0 auto 1.25rem', maxWidth: '380px' }}>
                    {config.subtitle || 'This module is undergoing final optimizations for production deployment.'}
                </p>

                {/* Planned Highlights */}
                {config.features && config.features.length > 0 && (
                    <div style={{
                        textAlign: 'left',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '14px',
                        padding: '0.9rem 1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            Planned Capabilities
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {config.features.map((feat, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155' }}>
                                    <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                                    <span>{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Primary Action Button */}
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#1D4ED8',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
                        transition: 'transform 0.1s ease, background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1E40AF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#1D4ED8'; }}
                >
                    Got It
                </button>
            </div>
        </div>
    );
}

export { COMING_SOON_CONFIG };
