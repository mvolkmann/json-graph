const MAX_TEXT_LENGTH = 8;

export function limitText(text) {
  const t = String(text);
  return t.length < MAX_TEXT_LENGTH
    ? t
    : t.substring(0, MAX_TEXT_LENGTH - 2) + '...';
}
