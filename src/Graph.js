import React, {useCallback, useEffect, useRef, useState} from 'react';
import {v4 as uuidV4} from 'uuid';
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
const NODE_RADIUS = 30;
const DELTA_ARC_LENGTH = NODE_RADIUS * 2.5;
const DELTA_RADIUS = 150;
const HIDDEN_PROPS = new Set([
  '_center',
  '_isCenter',
  '_layer',
  '_placed',
  'id',
  'source',
  'target'
]);
const MAX_TEXT_LENGTH = 8;
const NODE_DIAMETER = NODE_RADIUS * 2;
const ZOOM_FACTOR = 0.1;

function Graph({data, edgeProp, pointProp}) {
  const [edgeColor, setEdgeColor] = useState('black');
  const {edges, points} = data;
  const [centerPoint, setCenterPoint] = useState(null);
  const [height, setHeight] = useState(0);
  const [hoverEdge, setHoverEdge] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [pointColor, setPointColor] = useState('black');
  const [selectedEdgeProp, setSelectedEdgeProp] = useState(edgeProp);
  const [selectedPointProp, setSelectedPointProp] = useState(pointProp);
  const [textColor, setTextColor] = useState('black');
  const [viewBox, setViewBox] = useState('0 0 0 0');
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  let edgeMap = {};

  let graphRef2 = useRef(null);

  const graphRef = useCallback(element => {
    if (!element) return;

    graphRef2.current = element;

    // Get the values of some CSS variables.
    setPointColor(getCssVariable('--point-color'));
    setEdgeColor(getCssVariable('--edge-color'));
    setTextColor(getCssVariable('--text-color'));
    const w = parseInt(getCssVariable('--width'));
    setWidth(w);
    const h = parseInt(getCssVariable('--height'));
    setHeight(h);

    const centerPoint = points[0];
    centerPoint._isCenter = true;
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

  useEffect(() => {
    setTimeout(() => {
      console.log('Graph.js useEffect: edgeMap =', edgeMap);
    }, 500);
  }, []);

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
    console.log('Graph.js changeCenter: entered');
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

  function getCssVariable(name) {
    const style = getComputedStyle(graphRef2.current);
    return style.getPropertyValue(name).trim();
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

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function handlePointerDown(event) {
    lastX = event.clientX;
    lastY = event.clientY;
    dragging = true;

    // Debugging
    const pointId = event.target.id;
    const edges = edgeMap[pointId];
    console.log('edges from', pointId, 'are', edges);
    for (const edge of edges) {
      console.log('Graph.js x: line =', document.getElementById(edge));
    }
  }

  function handlePointerMove(event, index) {
    console.log('Graph.js handlePointerMove: dragging =', dragging);
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

    // Not hovering over anything yet.
    setHoverPoint(null);
    setHoverEdge(null);

    updateViewBox();
  }

  function limitText(text) {
    return text.length < MAX_TEXT_LENGTH
      ? text
      : text.substring(0, MAX_TEXT_LENGTH - 2) + '...';
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

  function renderColorPicker(kind, value) {
    const id = kind + '-color';
    const capitalized = kind[0].toUpperCase() + kind.substring(1);
    return (
      <div className="vstack">
        <label htmlFor={id}>{capitalized} Color</label>
        <input
          id={id}
          type="color"
          value={value}
          onChange={e => {
            const color = e.target.value;
            setPointColor(color);
            setCssVariable('--' + id, color);
          }}
        />
      </div>
    );
  }

  function renderControls() {
    return (
      <div className="controls hstack">
        {renderSelect(true)}
        {renderSelect(false)}
        {renderColorPicker('point', pointColor)}
        {renderColorPicker('edge', edgeColor)}
        {renderColorPicker('text', textColor)}
        <div className="buttons">
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
      </div>
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

    // Keep track of the edges that connect to each point.
    const edgeId = 'edge-' + uuidV4();
    trackEdge('point-' + source, edgeId);
    trackEdge('point-' + target, edgeId);

    return (
      <g className="edge" key={edgeId}>
        <line
          id={edgeId}
          data-start-id={source}
          x1={center1.x}
          y1={center1.y}
          x2={center2.x}
          y2={center2.y}
          onMouseEnter={() => edgeHover(edge)}
          //onMouseLeave={() => setHoverEdge(null)}
        />
        {renderArrow(edge)}
        <text x={edge._center.x} y={edge._center.y}>
          {edge[selectedEdgeProp]}
        </text>
      </g>
    );
  }

  const renderEdgePopup = edge => renderPopup(edge, edgeProps);

  function renderPoint(point, index) {
    if (!point._placed) return;

    const {_center, id} = point;
    if (!_center) return null;

    return (
      <g className={point._isCenter ? 'center' : ''} key={'circle' + point.id}>
        <circle
          id={'point-' + id}
          cx={_center.x}
          cy={_center.y}
          r={NODE_RADIUS}
          onClick={() => {
            if (centerPoint) centerPoint._isCenter = false;
            point._isCenter = true;
            setCenterPoint(point);
          }}
          onMouseEnter={() => pointHover(point)}
          //onMouseLeave={() => setHoverPoint(null)}
          onPointerDown={handlePointerDown}
          onPointerMove={e => handlePointerMove(e, point, index)}
          onPointerUp={handlePointerUp}
        />
        <text key={'text' + point.id} x={_center.x} y={_center.y}>
          {limitText(point[selectedPointProp])}
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
          width="100"
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
      <div className="vstack" key={key}>
        <label>{label} Property</label>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {props.map(prop => (
            <option key={prop}>{prop}</option>
          ))}
        </select>
      </div>
    );
  }

  function setCssVariable(name, value) {
    graphRef2.current.style.setProperty(name, value);
  }

  function trackEdge(pointId, edgeId) {
    console.log('Graph.js trackEdge: pointId =', pointId);
    console.log('Graph.js trackEdge: edgeId =', edgeId);
    let list = edgeMap[pointId];
    if (!list) list = edgeMap[pointId] = [];
    list.push(edgeId);
  }

  function updateViewBox() {
    // Determine the required width and height
    // to display all the points.
    let maxX = 0;
    let maxY = 0;
    let minX = 0;
    let minY = 0;
    Object.values(pointMap).forEach(point => {
      const {x, y} = point._center;
      if (x > maxX) maxX = x;
      if (x < minX) minX = x;
      if (y > maxY) maxY = y;
      if (y < minY) minY = y;
    });
    minX -= NODE_RADIUS;
    maxX += NODE_RADIUS;
    minY -= NODE_RADIUS;
    maxY += NODE_RADIUS;
    setViewBox(`${minX - 1} ${minY - 1} ${maxX - minX + 2} ${maxY - minY + 2}`);
  }

  console.log('Graph.js: RENDERING AGAIN!');
  return (
    <div className="graph" ref={graphRef}>
      {renderControls()}
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
