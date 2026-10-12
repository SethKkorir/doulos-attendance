/**
 * Shared Doulos Administrative Design System Index
 * Reusable across SuperAdmin, Admin, Operator, G1-G9 directorates
 */

// Core Shell & Layout
export { default as AdminLayout, AdminLayout as AdminLayoutComponent } from './AdminLayout';
export { default as Sidebar } from './Sidebar';
export { default as Topbar } from './Topbar';
export { PageHeader, Card, StatCard } from './Card';

// Interactive Components
export { default as Button } from './Button';
export { default as DataTable } from './DataTable';
export { default as Modal } from './Modal';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as NotificationCenter } from './NotificationCenter';
export { default as FilterBar, SearchBar } from './FilterBar';

// Form Controls
export { default as FormControls, Input, Select, FormGroup } from './FormControls';

// Feedback & Indicators
export { default as Alert, Toast } from './Alert';
export { default as StatusPill } from './StatusPill';
export { default as RankBadge } from './RankBadge';
export { default as LoadingState } from './LoadingState';
export { default as EmptyState } from './EmptyState';
export { default as ErrorState } from './ErrorState';
export { renderIcon } from './iconHelper';
