import {useCallback, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faSearchMinus,
  faSearchPlus,
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
  const [height, setHeight] = useState(0);
  const [hoverEdge, setHoverEdge] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [selectedEdgeProp, setSelectedEdgeProp] = useState(edgeProp);
  const [selectedPointProp, setSelectedPointProp] = useState(pointProp);
  const [viewBox, setViewBox] = useState('0 0 0 0');
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  const graphRef = useCallback(element => {
    const style = getComputedStyle(element);
    const w = parseInt(style.getPropertyValue('--width'));
    setWidth(w);
    const h = parseInt(style.getPropertyValue('--height'));
    setHeight(h);
    setViewBox(`0 0 ${w} ${h}`);

    layout(w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const svgRef = useRef(null);

  const edgeProps = getObjectProps(edges[0]);
  const pointProps = getObjectProps(points[0]);
  const pointMap = points.reduce((acc, point) => {
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

  function getArrowPoints(p1, p2) {
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    const arrowTip = {
      x: p2.x + NODE_RADIUS * Math.cos(Math.PI - angle),
      y: p2.y - NODE_RADIUS * Math.sin(Math.PI - angle)
    };

    // Find the middle of the arrow base.
    const middle = {
      x: p2.x + (NODE_RADIUS + ARROW_LENGTH) * Math.cos(Math.PI - angle),
      y: p2.y - (NODE_RADIUS + ARROW_LENGTH) * Math.sin(Math.PI - angle)
    };

    const dx = (Math.sin(angle) * ARROW_LENGTH) / 2;
    const dy = (Math.cos(angle) * ARROW_LENGTH) / 2;
    const arrowLeft = {x: middle.x - dx, y: middle.y + dy};
    const arrowRight = {x: middle.x + dx, y: middle.y - dy};

    return (
      `${arrowTip.x},${arrowTip.y} ` +
      `${arrowLeft.x},${arrowLeft.y} ` +
      `${arrowRight.x},${arrowRight.y}`
    );
  }

  function getTargetPoints(point) {
    // Find all the edges starting from this point.
    const targetEdges = edges.filter(edge => edge.source === point.id);

    // Find all the points that are targets of these edges
    // and have not been placed yet.
    return targetEdges
      .map(edge => pointMap[edge.target])
      .filter(point => !point._placed);
  }

  function layout(width, height) {
    // Place the first point in the center.
    const firstPoint = points[0];
    firstPoint._center = {x: width / 2, y: height / 2};
    firstPoint._layer = 0;
    firstPoint._placed = true;

    placeTargetsRadially(width, height, firstPoint);

    for (const edge of edges) {
      const p1 = pointMap[edge.source]._center;
      if (!p1) throw new Error('no center for point ' + edge.source);
      const p2 = pointMap[edge.target]._center;
      if (!p2) throw new Error('no center for point ' + edge.target);
      edge._center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      };
    }
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
        const newRadius = targetRadius + DELTA_RADIUS;
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
      p => p._layer >= _layer
    );
    return pointsToCheck.some(p => {
      // Don't check a point against itself.
      if (p.id === point.id) return false;

      return distanceBetweenPoints(point, p) < NODE_DIAMETER;
    });
  }

  // For debugging ...
  //const radiansToDegrees = radians => (radians * 180) / (2 * Math.PI);

  function renderEdge(edge, index) {
    const {source, target} = edge;
    const p1 = pointMap[source]._center;
    const p2 = pointMap[target]._center;
    if (!p1 || !p2) return null;

    return (
      <g key={'edge' + index}>
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          onMouseEnter={() => edgeHover(edge)}
          //onMouseLeave={() => setHoverEdge(null)}
        />
        <polygon className="arrow" points={getArrowPoints(p1, p2)} />
        <text key={'text' + index} x={edge._center.x} y={edge._center.y}>
          {edge[selectedEdgeProp]}
        </text>
      </g>
    );
  }

  const renderEdgePopup = edge => renderPopup(edge, edgeProps);

  function renderPoint(point) {
    const {_center} = point;
    if (!_center) return null;
    return (
      <g key={'circle' + point.id}>
        <circle
          cx={_center.x}
          cy={_center.y}
          r={NODE_RADIUS}
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
