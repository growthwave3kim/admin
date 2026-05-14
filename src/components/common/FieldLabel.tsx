export const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <p className="mb-1.5 font-medium text-gray-500 text-xs dark:text-gray-400">
    {children}
    {required && <span className="ml-0.5 text-gray-400">*</span>}
  </p>
)

/** h-9 — standard form fields */
export const inputClass =
  'h-9 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'

/** h-8 — compact form fields (inline lists, settings pages) */
export const inputClassSm =
  'h-8 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'
