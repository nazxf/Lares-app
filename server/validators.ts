// Input validation utilities

export function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeRequiredString(value: unknown, fieldName: string): string {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    const error = new Error(`${fieldName} wajib diisi`);
    Object.assign(error, { status: 400 });
    throw error;
  }
  return normalized;
}

export function numberFrom(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePositiveNumber(value: number, fieldName: string): number {
  if (value < 0) {
    const error = new Error(`${fieldName} harus bernilai positif`);
    Object.assign(error, { status: 400 });
    throw error;
  }
  return value;
}

export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): number {
  if (value < min || value > max) {
    const error = new Error(`${fieldName} harus antara ${min} dan ${max}`);
    Object.assign(error, { status: 400 });
    throw error;
  }
  return value;
}
