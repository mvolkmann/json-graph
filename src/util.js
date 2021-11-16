const HIDDEN_PROPS = new Set([
  '_center',
  '_isCenter',
  '_layer',
  '_placed',
  'id',
  'source',
  'target'
]);
const MAX_TEXT_LENGTH = 8;

export function distanceBetweenPoints(point1, point2) {
  const center1 = point1._center;
  const center2 = point2._center;
  const dx = center1.x - center2.x;
  const dy = center1.y - center2.y;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

export function getCssVariable(ref, name) {
  const style = getComputedStyle(ref.current);
  return style.getPropertyValue(name).trim();
}

export function getObjectProps(object) {
  return Object.keys(object)
    .filter(key => !HIDDEN_PROPS.has(key))
    .sort();
}

export function limitText(text) {
  return text.length < MAX_TEXT_LENGTH
    ? text
    : text.substring(0, MAX_TEXT_LENGTH - 2) + '...';
}

export const radiansToDegrees = radians => (radians * 180) / (2 * Math.PI);

export function setCssVariable(ref, name, value) {
  ref.current.style.setProperty(name, value);
}
