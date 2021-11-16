import React from 'react';
import {limitText} from './utilities/string';
import './Point.scss';

function Point({
  dragged,
  edgeMap,
  hover,
  isSelected,
  point,
  prop,
  radius,
  select
}) {
  if (!point._placed) return null;
  const {_center} = point;
  if (!_center) return null;

  let dragging = false;

  const classes = ['point'];
  if (isSelected) classes.push('selected');
  if (point._isCenter) classes.push('center');

  function handlePointerDown(event) {
    dragging = true;
    setEdgeOpacities(0);
  }

  function handlePointerMove(event) {
    if (dragging) {
      // Get the location of the mouse cursor in SVG coordinates.
      var svg = event.target.parentElement.parentElement;
      var screenPoint = svg.createSVGPoint();
      screenPoint.x = event.clientX;
      screenPoint.y = event.clientY;
      const svgPoint = screenPoint.matrixTransform(
        svg.getScreenCTM().inverse()
      );

      // Move the circle for the point.
      const circle = event.target;
      circle.setAttribute('cx', svgPoint.x);
      circle.setAttribute('cy', svgPoint.y);

      // Move the text for the point.
      const text = circle.parentElement.querySelector('text');
      text.setAttribute('x', svgPoint.x);
      text.setAttribute('y', svgPoint.y);

      // Update the point location.
      point._center = {x: svgPoint.x, y: svgPoint.y};
    }
  }

  function handlePointerUp() {
    dragging = false;
    dragged();
    setEdgeOpacities(1);
  }

  function setEdgeOpacities(opacity) {
    const edgeIds = edgeMap[point.id];
    for (const edgeId of edgeIds) {
      const group = document.getElementById(edgeId);
      if (group) group.style.opacity = opacity;
    }
  }

  return (
    <g className={classes.join(' ')}>
      <circle
        cx={_center.x}
        cy={_center.y}
        r={radius}
        onClick={() => select(point)}
        onMouseEnter={() => hover(point)}
        //onMouseLeave={() => setHoverPoint(null)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <text x={_center.x} y={_center.y}>
        {limitText(point[prop])}
      </text>
    </g>
  );
}

export default Point;
