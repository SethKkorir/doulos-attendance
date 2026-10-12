import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * Shared Doulos Design System: ConfirmDialog
 * - High-clarity operational confirmation modal
 * - Destructive or standard primary action
 */

export const ConfirmDialog = ({
    isOpen = false,
    onClose,
    onCancel,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed with this action?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant,
    isDestructive = false,
    loading = false
}) => {
    if (!isOpen) return null;

    const handleClose = onCancel || onClose;
    const destructive = isDestructive || variant === 'danger' || variant === 'destructive';

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="440px"
        >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: destructive ? 'var(--ds-status-danger-bg, #FEF2F2)' : 'var(--ds-status-info-bg, #EFF6FF)',
                    color: destructive ? 'var(--ds-status-danger-text, #B91C1C)' : 'var(--ds-status-info-text, #1D4ED8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {destructive ? <AlertTriangle size={20} /> : <Info size={20} />}
                </div>

                <div style={{ flex: 1 }}>
                    <h3 style={{
                        margin: '0 0 0.35rem',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'var(--ds-text-primary, #0F172A)'
                    }}>
                        {title}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '0.86rem',
                        color: 'var(--ds-text-secondary, #475569)',
                        lineHeight: 1.5
                    }}>
                        {message}
                    </p>
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--ds-border-subtle, #F1F5F9)'
            }}>
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={loading}
                >
                    {cancelText}
                </Button>
                <Button
                    variant={destructive ? 'danger' : 'primary'}
                    onClick={onConfirm}
                    loading={loading}
                >
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
