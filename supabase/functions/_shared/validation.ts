export interface ValidationError {
  field: string;
  message: string;
}

export function validateBody(body: Record<string, unknown>, required: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push({ field, message: `${field} is required` });
    }
  }
  return errors;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function validateAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && Number.isFinite(amount);
}

export function validateSeconds(seconds: number): boolean {
  return typeof seconds === 'number' && seconds >= 0 && Number.isInteger(seconds);
}
