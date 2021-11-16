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
  let lastX = 0;
  let lastY = 0;

  const classes = ['point'];
  if (isSelected) classes.push('selected');
  if (point._isCenter) classes.push('center');

  function handlePointerDown(event) {
    lastX = event.clientX;
    lastY = event.clientY;
    dragging = true;
  }

  function handlePointerMove(event) {
    if (dragging) {
      // Move the circle for the point.
      const circle = event.target;
      const cx = Number(circle.getAttribute('cx'));
      const cy = Number(circle.getAttribute('cy'));
      const newX = event.clientX;
      const newY = event.clientY;
      const dx = newX - lastX;
      const dy = newY - lastY;
      const newCx = cx + dx;
      const newCy = cy + dy;
      circle.setAttribute('cx', newCx);
      circle.setAttribute('cy', newCy);

      // Move the text for the point.
      const text = circle.parentElement.querySelector('text');
      text.setAttribute('x', newCx);
      text.setAttribute('y', newCy);

      point._center = {x: newCx, y: newCy};

      /*
      // Find all the connected edges and update their endpoints.
      const edgeIds = edgeMap[point.id];
      console.log('Point.jsx x: edgeIds =', edgeIds);
      for (const edgeId of edgeIds) {
        const group = document.getElementById(edgeId);
        if (!group) continue;

        const line = group.querySelector('line');
        if (line) {
          // non-cycle edge
          // Get the endpoints of the line
          let x1 = Number(line.getAttribute('x1'));
          let y1 = Number(line.getAttribute('y1'));
          let x2 = Number(line.getAttribute('x2'));
          let y2 = Number(line.getAttribute('y2'));

          // Move one of the line endpoints for the edge.
          const startId = line.getAttribute('data-start-id');
          const sourceEnd = startId === String(point.id);
          if (sourceEnd) {
            x1 += dx;
            y1 += dy;
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
          } else {
            x2 += dx;
            y2 += dy;
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
          }

          // Move the edge text.
          const text = group.querySelector('text');
          const textX = (x1 + x2) / 2;
          const textY = (y1 + y2) / 2;
          text.setAttribute('x', textX);
          text.setAttribute('y', textY);
        } else {
          const circle = group.querySelector('circle');
          console.log('Point.jsx x: circle =', circle);
          if (circle) {
            // cycle edge
          }
        }
      }
      */

      lastX = newX;
      lastY = newY;
    }
  }

  function handlePointerUp() {
    dragging = false;
    dragged();
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
