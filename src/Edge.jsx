import React from 'react';
import {v4 as uuidV4} from 'uuid';
import './Edge.scss';

const ARROW_LENGTH = 10;

function Edge({edge, hover, pointMap, prop, radius}) {
  const {source, target} = edge;
  const p1 = pointMap[source];
  const p2 = pointMap[target];
  if (!p1 || !p2) return null;
  if (!p1._placed || !p2._placed) return null;

  const center1 = p1._center;
  const center2 = p2._center;
  if (!center1 || !center2) return null;

  if (p1 === p2) {
    const cx = center1.x - radius * 0.75;
    const cy = center1.y - radius * 0.75;
    return (
      <g className="edge" key={`edge-${source}-${target}`}>
        <circle
          className="cycle"
          cx={cx}
          cy={cy}
          r={radius / 2}
          onMouseEnter={() => hover(edge)}
        />
        {/* The numbers here were arrived at by trial and error. */}
        {renderArrow2(edge, 0.65, {
          x: cx + radius * 0.48,
          y: cy - radius * 0.25
        })}
      </g>
    );
  }

  // Keep track of the edges that connect to each point.
  const edgeId = 'edge-' + uuidV4();
  //trackEdge('point-' + source, edgeId);
  //trackEdge('point-' + target, edgeId);

  function renderArrow(edge) {
    const {source, target} = edge;
    const p1 = pointMap[source];
    const p2 = pointMap[target];
    const center1 = p1._center;
    const center2 = p2._center;
    if (!center1 || !center2) return null;

    const angle = Math.atan2(center2.y - center1.y, center2.x - center1.x);
    const complementaryAngle = Math.PI - angle;

    const tip = {
      x: center2.x + radius * Math.cos(complementaryAngle),
      y: center2.y - radius * Math.sin(complementaryAngle)
    };

    return renderArrow2(edge, angle, tip);
  }

  function renderArrow2(edge, angle, tip) {
    const complementaryAngle = Math.PI - angle;

    // Find the middle of the arrow base.
    const middle = {
      x: tip.x + ARROW_LENGTH * Math.cos(complementaryAngle),
      y: tip.y - ARROW_LENGTH * Math.sin(complementaryAngle)
    };

    const dx = (Math.sin(angle) * ARROW_LENGTH) / 2;
    const dy = (Math.cos(angle) * ARROW_LENGTH) / 2;
    const arrowLeft = {x: middle.x - dx, y: middle.y + dy};
    const arrowRight = {x: middle.x + dx, y: middle.y - dy};

    const points =
      `${tip.x},${tip.y} ` +
      `${arrowLeft.x},${arrowLeft.y} ` +
      `${arrowRight.x},${arrowRight.y}`;
    return (
      <polygon
        className="arrow"
        points={points}
        onMouseEnter={() => hover(edge)}
      />
    );
  }

  return (
    <g className="edge" key={edgeId}>
      <line
        id={edgeId}
        data-start-id={source}
        x1={center1.x}
        y1={center1.y}
        x2={center2.x}
        y2={center2.y}
        onMouseEnter={() => hover(edge)}
        //onMouseLeave={() => setHoverEdge(null)}
      />
      {renderArrow(edge)}
      <text x={edge._center.x} y={edge._center.y}>
        {edge[prop]}
      </text>
    </g>
  );
}

export default Edge;
