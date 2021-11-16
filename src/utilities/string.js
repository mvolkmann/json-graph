const MAX_TEXT_LENGTH = 8;

export function limitText(text) {
  return text.length < MAX_TEXT_LENGTH
    ? text
    : text.substring(0, MAX_TEXT_LENGTH - 2) + '...';
}
