const HIDDEN_PROPS = new Set([
  '_center',
  '_isCenter',
  '_layer',
  '_placed',
  'id',
  'source',
  'target'
]);

export function getObjectProps(object) {
  return Object.keys(object)
    .filter(key => !HIDDEN_PROPS.has(key))
    .sort();
}
