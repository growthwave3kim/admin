export const FieldLabel = ({
  children,
  required,
}: { children: React.ReactNode; required?: boolean }) => (
  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
    {children}
    {required && <span className="text-gray-400 ml-0.5">*</span>}
  </p>
)

/** h-9 — standard form fields */
export const inputClass =
  'h-9 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'

/** h-8 — compact form fields (inline lists, settings pages) */
export const inputClassSm =
  'h-8 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'
