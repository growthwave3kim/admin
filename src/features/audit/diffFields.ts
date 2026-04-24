export const diffFields = (
  oldRow: Record<string, unknown>,
  newPayload: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> => {
  const changed: Record<string, { old: unknown; new: unknown }> = {}
  for (const key of Object.keys(newPayload)) {
    if (oldRow[key] !== newPayload[key]) {
      changed[key] = { old: oldRow[key], new: newPayload[key] }
    }
  }
  return changed
}
