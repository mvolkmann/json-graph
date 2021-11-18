export function distanceBetweenPoints(point1, point2) {
  const center1 = point1._center;
  const center2 = point2._center;
  const dx = center1.x - center2.x;
  const dy = center1.y - center2.y;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

export const radiansToDegrees = (radians) => (radians * 180) / (2 * Math.PI);
