const SKELETON_COLS = [
  'company',
  'status',
  'start',
  'end',
  'received',
  'cost',
  'profit',
  'note',
  'marketing',
  'created',
  'actions',
]

export const SkeletonRow = () => (
  <tr className="border-b border-gray-100 dark:border-gray-800/60">
    {SKELETON_COLS.map((col) => (
      <td key={col} className="px-4 py-3">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </td>
    ))}
  </tr>
)
