import React from 'react';
import {limitText} from './utilities/string';
import './Point.scss';

function Point({edgeMap, hover, isSelected, point, prop, radius, select}) {
  if (!point._placed) return null;
  const {_center, id} = point;
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

    // Debugging
    const pointId = event.target.id;
    const edges = edgeMap[pointId];
    console.log('edges from', pointId, 'are', edges);
    if (edges) {
      for (const edge of edges) {
        console.log('Graph.js x: line =', document.getElementById(edge));
      }
    }
  }

  function handlePointerMove(event) {
    if (dragging) {
      const circle = event.target;
      const pointId = circle.getAttribute('id');
      console.log('Graph.js x: pointId =', pointId);
      const cx = Number(circle.getAttribute('cx'));
      //console.log('Graph.js x: cx =', cx);
      const cy = Number(circle.getAttribute('cy'));
      const newX = event.clientX;
      //console.log('Graph.js x: newX =', newX);
      //console.log('Graph.js x: lastX =', lastX);
      const newY = event.clientY;
      const dx = newX - lastX;
      const dy = newY - lastY;
      const newCx = cx + dx;
      const newCy = cy + dy;
      circle.setAttribute('cx', newCx);
      circle.setAttribute('cy', newCy);

      // Find all the connected edges and update their endpoints.
      const edgeIds = edgeMap[circle.getAttribute('id')];
      console.log('Graph.js x: edgeIds =', edgeIds);
      /*
      for (const edgeId of edgeIds) {
        const line = document.getElementById(edgeId);
        const startId = line.getAttribute('data-start-id');
        const sourceEnd = startId === pointId;
        const xAttr = sourceEnd ? 'x1' : 'x2';
        const yAttr = sourceEnd ? 'y1' : 'y2';
        const x = Number(line.getAttribute(xAttr));
        const y = Number(line.getAttribute(yAttr));
        line.setAttribute(xAttr, x + dx);
        line.setAttribute(yAttr, y + dy);
      }
      */

      lastX = newX;
      lastY = newY;
    } else {
      console.log('Graph.js handlePointerMove: not dragging');
    }
  }

  function handlePointerUp() {
    console.log('Graph.js handlePointerUp: entered');
    dragging = false;
  }

  return (
    <g className={classes.join(' ')}>
      <circle
        id={'point-' + id}
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
