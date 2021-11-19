export function getAncestorElement(element, name) {
  const parent = element.parentElement;
  if (parent.tagName === name) return parent;
  if (parent.tagName === 'BODY') return null;
  return getAncestorElement(parent, name);
}
