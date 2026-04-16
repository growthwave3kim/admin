export const getTooltipStyle = (isDark: boolean) => ({
  fontSize: 12,
  border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  backgroundColor: isDark ? '#111827' : '#ffffff',
  color: isDark ? '#e5e7eb' : '#374151',
  borderRadius: 4,
})

export const getAxisStyle = (isDark: boolean) => ({
  fontSize: 11,
  fill: isDark ? '#6b7280' : '#9ca3af',
})
