import React, {useCallback, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faCrosshairs,
  faSearchMinus,
  faSearchPlus,
  faSync,
  faUndo
} from '@fortawesome/free-solid-svg-icons';
import './Graph.scss';

const ARROW_LENGTH = 10;
const DELTA_ARC_LENGTH = 50;
const DELTA_RADIUS = 100;
const HIDDEN_PROPS = new Set([
  '_center',
  '_layer',
  '_placed',
  'id',
  'source',
  'target'
]);
const NODE_RADIUS = 20;
const NODE_DIAMETER = NODE_RADIUS * 2;
const ZOOM_FACTOR = 0.1;

function Graph({data, edgeProp, pointProp}) {
  console.log('Graph.js Graph: entered');
  const {edges, points} = data;
  const [centerPoint, setCenterPoint] = useState(null);
  const [height, setHeight] = useState(0);
  const [hoverEdge, setHoverEdge] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [pointColor, setPointColor] = useState('orange');
  const [selectedEdgeProp, setSelectedEdgeProp] = useState(edgeProp);
  const [selectedPointProp, setSelectedPointProp] = useState(pointProp);
  const [viewBox, setViewBox] = useState('0 0 0 0');
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const graphRef = useCallback(element => {
    if (!element) return;

    const style = getComputedStyle(element);
    const w = parseInt(style.getPropertyValue('--width'));
    setWidth(w);
    const h = parseInt(style.getPropertyValue('--height'));
    setHeight(h);
    setViewBox(`0 0 ${w} ${h}`);

    const centerPoint = points[0];
    setCenterPoint(centerPoint);
    layout(w, h, centerPoint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const svgRef = useRef(null);

  const edgeProps = getObjectProps(edges[0]);
  const pointProps = getObjectProps(points[0]);
  const pointMap = points.reduce((acc, point) => {
    if (!point.id) point.id = point.name;
    acc[point.id] = point;
    return acc;
  }, {});

  function adjustZoom(newZoom) {
    setZoom(newZoom);
    const newWidth = width * newZoom;
    const newHeight = height * newZoom;
    const dx = (width - newWidth) / 2;
    const dy = (height - newHeight) / 2;
    const {style} = svgRef.current;
    style.left = dx + 'px';
    style.top = dy + 'px';
  }

  function changeCenter(point) {
    // Allow all the points to be "placed" again.
    Object.values(pointMap).map(p => (p._placed = false));

    layout(width, height, point || centerPoint);
    forceUpdate();
  }

  function distanceBetweenPoints(point1, point2) {
    const center1 = point1._center;
    const center2 = point2._center;
    const dx = center1.x - center2.x;
    const dy = center1.y - center2.y;
    return Math.sqrt(dx ** 2 + dy ** 2);
  }

  function getObjectProps(object) {
    return Object.keys(object)
      .filter(key => !HIDDEN_PROPS.has(key))
      .sort();
  }

  function edgeHover(edge) {
    setHoverPoint(null);
    setHoverEdge(edge);
  }

  function getTargetPoints(point) {
    // Find all the edges starting from this point.
    const targetEdges = edges.filter(edge => edge.source === point.id);

    // Find all the points that are targets of these edges
    // and have not been placed yet.
    return targetEdges
      .map(edge => pointMap[edge.target])
      .filter(point => point && !point._placed);
  }

  function layout(width, height, centerPoint) {
    // Place the first point in the center.
    centerPoint._center = {x: width / 2, y: height / 2};
    centerPoint._layer = 0;
    centerPoint._placed = true;

    placeTargetsRadially(width, height, centerPoint);

    for (const edge of edges) {
      const p1 = pointMap[edge.source];
      const p2 = pointMap[edge.target];
      if (p1 && p2) {
        const center1 = p1._center;
        const center2 = p2._center;

        edge._center = {
          x: (center1.x + center2.x) / 2,
          y: (center1.y + center2.y) / 2
        };
      }
    }

    // Clear this so the center point doesn't render as being selected.
    setCenterPoint(null);
  }

  function placeTargets(width, height, sourcePoint, layer) {
    const targetPoints = getTargetPoints(sourcePoint);
    const count = targetPoints.length;
    if (count === 0) return;

    const targetRadius = layer * DELTA_RADIUS;
    const arcLength = (count - 1) * DELTA_ARC_LENGTH;
    const arcAngle = arcLength / targetRadius;
    const deltaAngle = arcAngle / (count - 1);

    const sourceCenter = sourcePoint._center;
    const graphCenter = {x: width / 2, y: height / 2};
    const sourceAngle = Math.atan2(
      sourceCenter.y - graphCenter.y,
      sourceCenter.x - graphCenter.x
    );

    let angle = sourceAngle - arcAngle / 2;
    for (const targetPoint of targetPoints) {
      targetPoint._center = {
        x: graphCenter.x + Math.cos(angle) * targetRadius,
        y: graphCenter.y + Math.sin(angle) * targetRadius
      };
      targetPoint._layer = layer;

      if (pointOverlaps(targetPoint)) {
        const newRadius = targetRadius + DELTA_RADIUS * 0.5;
        angle += 0.07; // offsets lines just a bit for less overlap
        targetPoint._center = {
          x: graphCenter.x + Math.cos(angle) * newRadius,
          y: graphCenter.y + Math.sin(angle) * newRadius
        };
        targetPoint._layer++;
      }

      targetPoint._placed = true;
      angle += deltaAngle;
    }

    for (const targetPoint of targetPoints) {
      placeTargets(width, height, targetPoint, layer + 1);
    }
  }

  function placeTargetsRadially(width, height, sourcePoint) {
    const targetPoints = getTargetPoints(sourcePoint);

    // Calculate the delta angle in radians to use for
    // spreading these points around a circle.
    const deltaAngle = (2 * Math.PI) / targetPoints.length;

    const {_center} = sourcePoint;
    let angle = 0;
    for (const targetPoint of targetPoints) {
      targetPoint._center = {
        x: _center.x + DELTA_RADIUS * Math.cos(angle),
        y: _center.y + DELTA_RADIUS * Math.sin(angle)
      };
      targetPoint._layer = 1;
      targetPoint._placed = true;
      angle += deltaAngle;

      placeTargets(width, height, targetPoint, 2);
    }
  }

  function pointHover(point) {
    setHoverEdge(null);
    setHoverPoint(point);
  }

  function pointOverlaps(point) {
    const {_layer} = point;
    const pointsToCheck = Object.values(pointMap).filter(
      p => p._placed && p._layer >= _layer
    );
    return pointsToCheck.some(p => {
      // Don't check a point against itself.
      if (p.id === point.id) return false;

      return distanceBetweenPoints(point, p) < NODE_DIAMETER;
    });
  }

  // For debugging ...
  //const radiansToDegrees = radians => (radians * 180) / (2 * Math.PI);

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
      x: center2.x + NODE_RADIUS * Math.cos(complementaryAngle),
      y: center2.y - NODE_RADIUS * Math.sin(complementaryAngle)
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
        onMouseEnter={() => edgeHover(edge)}
      />
    );
  }

  function renderEdge(edge, index) {
    const {source, target} = edge;
    const p1 = pointMap[source];
    const p2 = pointMap[target];
    if (!p1 || !p2) return null;
    if (!p1._placed || !p2._placed) return null;

    const center1 = p1._center;
    const center2 = p2._center;
    if (!center1 || !center2) return null;

    if (p1 === p2) {
      const cx = center1.x - NODE_RADIUS * 0.75;
      const cy = center1.y - NODE_RADIUS * 0.75;
      return (
        <g className="edge" key={'self' + p1.id}>
          <circle
            className="cycle"
            cx={cx}
            cy={cy}
            r={NODE_RADIUS / 2}
            onMouseEnter={() => edgeHover(edge)}
          />
          {/* The numbers here were arrived at by trial and error. */}
          {renderArrow2(edge, 0.65, {
            x: cx + NODE_RADIUS * 0.48,
            y: cy - NODE_RADIUS * 0.25
          })}
        </g>
      );
    }

    return (
      <g className="edge" key={'edge' + index}>
        <line
          x1={center1.x}
          y1={center1.y}
          x2={center2.x}
          y2={center2.y}
          onMouseEnter={() => edgeHover(edge)}
          //onMouseLeave={() => setHoverEdge(null)}
        />
        {renderArrow(edge)}
        <text key={'text' + index} x={edge._center.x} y={edge._center.y}>
          {edge[selectedEdgeProp]}
        </text>
      </g>
    );
  }

  const renderEdgePopup = edge => renderPopup(edge, edgeProps);

  function renderPoint(point) {
    if (!point._placed) return;

    const {_center} = point;
    if (!_center) return null;

    return (
      <g
        className={point === centerPoint ? 'center' : ''}
        key={'circle' + point.id}
      >
        <circle
          cx={_center.x}
          cy={_center.y}
          r={NODE_RADIUS}
          onClick={() => setCenterPoint(point)}
          onMouseEnter={() => pointHover(point)}
          //onMouseLeave={() => setHoverPoint(null)}
        />
        <text key={'text' + point.id} x={_center.x} y={_center.y}>
          {point[selectedPointProp]}
        </text>
      </g>
    );
  }

  const renderPointPopup = point => renderPopup(point, pointProps);

  function renderPopup(hoverObject, props) {
    if (!hoverObject || !hoverObject._center) return null;
    const {x, y} = hoverObject._center;
    const rowHeight = 15;
    return (
      <g className="popup">
        <rect
          x={x}
          y={y}
          width="80"
          height={(props.length + 0.5) * rowHeight}
        />
        <text x={x} y={y}>
          {props.map((prop, index) => (
            <tspan key={prop} x={x + 5} y={y + (index + 1) * rowHeight}>
              {prop}: {hoverObject[prop]}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  function renderSelect(forPoints) {
    const label = forPoints ? 'Point' : 'Edge';
    const key = label + '-select';
    const props = forPoints ? pointProps : edgeProps;
    const selected = forPoints ? selectedPointProp : selectedEdgeProp;
    const setSelected = forPoints ? setSelectedPointProp : setSelectedEdgeProp;
    return (
      <div className="select-wrapper" key={key}>
        <p className="label">{label} Property</p>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {props.map(prop => (
            <option key={prop}>{prop}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="graph" ref={graphRef}>
      <div className="row">
        {renderSelect(true)}
        {renderSelect(false)}
        <button onClick={() => adjustZoom(zoom + ZOOM_FACTOR)}>
          <FontAwesomeIcon icon={faSearchPlus} size="lg" />
        </button>
        <button onClick={() => adjustZoom(zoom - ZOOM_FACTOR)}>
          <FontAwesomeIcon icon={faSearchMinus} size="lg" />
        </button>
        <button onClick={() => adjustZoom(1)}>
          <FontAwesomeIcon icon={faUndo} size="lg" />
        </button>
        <button onClick={() => changeCenter()}>
          <FontAwesomeIcon icon={faCrosshairs} size="lg" />
        </button>
        <button onClick={() => changeCenter(points[0])}>
          <FontAwesomeIcon icon={faSync} size="lg" />
        </button>
      </div>
      <div className="row">
        <input
          type="color"
          value={pointColor}
          onChange={e => setPointColor(e.target.value)}
        />
      </div>
      <div className="container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          ref={svgRef}
          viewBox={viewBox}
          style={{width: width * zoom + 'px', height: height * zoom + 'px'}}
        >
          {edges.map(renderEdge)}
          {points.map(renderPoint)}
          {renderPointPopup(hoverPoint)}
          {renderEdgePopup(hoverEdge)}
        </svg>
      </div>
    </div>
  );
}

export default Graph;
