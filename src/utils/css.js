export function getCssVariable(ref, name) {
  const style = getComputedStyle(ref.current);
  return style.getPropertyValue(name).trim();
}

export function setCssVariable(ref, name, value) {
  ref.current.style.setProperty(name, value);
}
