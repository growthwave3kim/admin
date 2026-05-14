const SKELETON_COLS = [
  'company',
  'marketing',
  'note',
  'received',
  'cost',
  'profit',
  'status',
  'member',
  'start',
  'end',
  'created',
  'actions',
]

export const SkeletonRow = () => (
  <tr className="border-gray-100 border-b dark:border-gray-800/60">
    {SKELETON_COLS.map((col) => (
      <td key={col} className="px-4 py-3">
        <div className="h-3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </td>
    ))}
  </tr>
)
