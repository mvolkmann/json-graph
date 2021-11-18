const MAX_TEXT_LENGTH = 12;

const substitutions = {
  Cpu: 'CPU',
  'Milli Sec': 'MS'
};

export function kebabCase(text) {
  return text.replace(/ /g, '-');
}

export function limitText(text) {
  const t = String(text);
  return t.length < MAX_TEXT_LENGTH
    ? t
    : t.substring(0, MAX_TEXT_LENGTH - 2) + '...';
}

export function startsUppercase(s) {
  const c = s[0];
  return 'A' <= c && c <= 'Z';
}

export function titleCase(text) {
  // Change all the hyphen and underscore characters to spaces.
  let t = text.replace(/[-_]/g, ' ');

  let result = t[0].toUpperCase();

  let i = 1;
  const { length } = text;
  while (i < length) {
    const c = t[i];

    if (c === ' ') {
      result += c;
      i++;
      result += t[i].toUpperCase();
    } else if (startsUppercase(c)) {
      result += ' ' + c;
    } else {
      result += c;
    }

    i++;
  }

  Object.entries(substitutions).forEach(([from, to]) => {
    result = result.replaceAll(from, to);
  });

  return result;
}
