/** Strip to digits for wa.me links (keeps country code, drops + and spaces). */
export function formatWhatsAppDigits(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const digits = formatWhatsAppDigits(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function isValidWhatsAppNumber(phone: string): boolean {
  const digits = formatWhatsAppDigits(phone);
  return digits.length >= 8 && digits.length <= 15;
}
