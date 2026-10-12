import React from 'react';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

/**
 * Shared Doulos Design System: DataTable
 * Features:
 * - Upper-case tracked header in muted tone (var(--ds-text-muted, #8E8B9F))
 * - Row dividers with subtle hover effect
 * - Responsive horizontal scroll container
 * - Integrated LoadingState and EmptyState fallbacks
 * - Row click handler support
 */

export const DataTable = ({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No records found in this view',
    emptyDescription = 'Try adjusting your search query or filter parameters.',
    emptyActionLabel,
    onEmptyAction,
    keyField = '_id',
    onRowClick,
    className = '',
    style = {}
}) => {
    if (loading) {
        return (
            <div className={`ds-table-wrap ${className}`} style={{ padding: '2rem 1rem', ...style }}>
                <LoadingState message="Loading table records..." />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <EmptyState
                title={emptyMessage}
                description={emptyDescription}
                actionLabel={emptyActionLabel}
                onAction={onEmptyAction}
            />
        );
    }

    return (
        <div className={`ds-table-wrap ${className}`} style={style}>
            <table className="ds-table">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={col.key || idx}
                                style={{
                                    textAlign: col.align || 'left',
                                    width: col.width,
                                    ...col.headerStyle
                                }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr
                            key={row[keyField] || rowIdx}
                            onClick={() => onRowClick && onRowClick(row)}
                            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        >
                            {columns.map((col, colIdx) => (
                                <td
                                    key={col.key || colIdx}
                                    style={{
                                        textAlign: col.align || 'left',
                                        ...col.cellStyle
                                    }}
                                >
                                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
