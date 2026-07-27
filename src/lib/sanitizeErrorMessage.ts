export const sanitizeErrorMessage = (input?: string | null, maxLength = 200): string => {
  if (!input) return "";

  const trimmed = input.trim().slice(0, maxLength);
  const withoutControlChars = trimmed.replace(/[\u0000-\u001F\u007F]/g, " ");
  const withoutHtml = withoutControlChars.replace(/[<>]/g, "");

  return withoutHtml;
};
