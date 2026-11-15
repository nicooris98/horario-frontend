export function isNonEmpty(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

export function normalizeDni(value: string | null | undefined): string {
  return (value ?? '').replace(/[.\s-]/g, '');
}

export function isValidDni(value: string | null | undefined): boolean {
  return /^\d{7,8}$/.test(normalizeDni(value));
}

export function isValidEmail(value: string | null | undefined): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? '').trim());
}

export function isIsoDate(value: string | null | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function isPositiveInt(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function normalizePositionName(name: string | null | undefined): string {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
