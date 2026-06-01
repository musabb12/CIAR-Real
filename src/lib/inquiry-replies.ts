/** Placeholders: {name} {email} {phone} {property} {message} */

export type InquiryReplyContext = {
  name: string;
  email: string;
  phone?: string | null;
  property?: string | null;
  message: string;
};

export function expandInquiryReplyTemplate(body: string, ctx: InquiryReplyContext): string {
  const phone = ctx.phone?.trim() || '';
  const property = ctx.property?.trim() || '';
  return body
    .replace(/\{name\}/g, ctx.name)
    .replace(/\{email\}/g, ctx.email)
    .replace(/\{phone\}/g, phone)
    .replace(/\{property\}/g, property)
    .replace(/\{message\}/g, ctx.message);
}

export function buildInquiryMailtoLink(input: {
  to: string;
  subject: string;
  body: string;
}): string {
  const params = new URLSearchParams({
    subject: input.subject,
    body: input.body,
  });
  return `mailto:${input.to.trim()}?${params.toString()}`;
}
