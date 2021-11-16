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

      // Remove all the connected edges.
      // These will be redrawn after the drag ends.
      const edgeIds = edgeMap[point.id];
      for (const edgeId of edgeIds) {
        const group = document.getElementById(edgeId);
        if (!group) continue;

        const line = group.querySelector('line');
        if (line) {
          hide(line);
          hide(group.querySelector('text'));
        } else {
          hide(group.querySelector('circle'));
        }
      }

      lastX = newX;
      lastY = newY;
    }
  }

  function handlePointerUp() {
    dragging = false;
    dragged();
  }

  function hide(element) {
    if (!element) return;
    //element.parentElement.removeChild(element);
    //element.style.display = 'none';
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
