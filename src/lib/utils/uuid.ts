export function isValidUUID(value: string): boolean {
  // Accept any UUID-shaped string (8-4-4-4-12 hex) regardless of version/variant
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function assertUUID(value: string, paramName: string = "id"): void {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID format for ${paramName}: ${value}`);
  }
}
