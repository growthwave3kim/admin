export const SkeletonRow = () => (
  <tr className="border-b border-gray-100 dark:border-gray-800/60">
    {Array.from({ length: 11 }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cells never reorder
      <td key={i} className="px-4 py-3">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </td>
    ))}
  </tr>
)
