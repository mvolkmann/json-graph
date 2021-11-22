import React, { Fragment, useCallback, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrosshairs,
  faSearchMinus,
  faSearchPlus,
  faSync,
  faUndo
} from '@fortawesome/free-solid-svg-icons';

import Point from './Point.jsx';
import Edge from './Edge.jsx';
import ColorPicker from '../ColorPicker.jsx';
import { getCssVariable, setCssVariable } from '../../utils/css';
import { distanceBetweenPoints } from '../../utils/math';
import { getObjectProps } from '../../utils/object';
import { titleCase } from '../../utils/string';

import './Graph.scss';

const NODE_RADIUS = 45;
const NODE_DIAMETER = NODE_RADIUS * 2;
const DELTA_ARC_LENGTH = NODE_RADIUS * 2.5;
const DELTA_RADIUS = 150;
const ZOOM_FACTOR = 0.25;

function Graph({ data, edgeProp, pointProp }) {
  const [edgeColor, setEdgeColor] = useState('black');
  const { edges, points } = data;
  const [centerPoint, setCenterPoint] = useState(null);
  const [height, setHeight] = useState(0);
  const [hover, setHover] = useState(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [pointColor, setPointColor] = useState('black');
  const [selectedEdgeProp, setSelectedEdgeProp] = useState(edgeProp);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedPointProp, setSelectedPointProp] = useState(pointProp);
  const [textColor, setTextColor] = useState('black');
  const [viewBox, setViewBox] = useState('0 0 0 0');
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  let graphRef2 = useRef(null);

  const graphRef = useCallback((element) => {
    if (!element) return;

    graphRef2.current = element;

    // Get the values of some CSS variables.
    setPointColor(getCssVariable(graphRef2, '--point-color'));
    setEdgeColor(getCssVariable(graphRef2, '--edge-color'));
    setTextColor(getCssVariable(graphRef2, '--text-color'));
    const w = parseInt(getCssVariable(graphRef2, '--width'));
    setWidth(w);
    const h = parseInt(getCssVariable(graphRef2, '--height'));
    setHeight(h);

    const firstPoint = points[0];
    firstPoint._isCenter = true;
    setCenterPoint(firstPoint);
    layout(w, h, firstPoint);
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

  function changeCenter(point) {
    if (!point) return;

    if (centerPoint) centerPoint._isCenter = false;
    point._isCenter = true;
    setCenterPoint(point);
    setSelectedPoint(null);

    // Allow all the points to be "placed" again.
    Object.values(pointMap).map((p) => (p._placed = false));

    layout(width, height, point);
    setZoom(1.0);
    forceUpdate();
  }

  function changeZoom(newZoom) {
    // Hide the current popup if any.
    setHover(null);

    setZoom(newZoom);
    const newWidth = width * newZoom;
    const newHeight = height * newZoom;
    const dx = (width - newWidth) / 2;
    const dy = (height - newHeight) / 2;

    const { current } = svgRef;
    const { style } = current;
    style.width = newWidth + 'px';
    style.height = newHeight + 'px';

    const container = current.parentElement;
    container.scrollLeft = -dx;
    container.scrollTop = -dy;
  }

  function getTargetPoints(point) {
    // Find all the edges starting from this point.
    const targetEdges = edges.filter((edge) => edge.source === point.id);

    // Find all the points that are targets of these edges
    // and have not been placed yet.
    return targetEdges
      .map((edge) => pointMap[edge.target])
      .filter((point) => point && !point._placed);
  }

  function handleMove(event) {
    if (!mouseDown) return;
    const { movementX, movementY } = event;
    const parent = svgRef.current.parentElement;
    if (movementX) parent.scrollLeft -= movementX;
    if (movementY) parent.scrollTop -= movementY;
  }

  function layout(width, height, centerPoint) {
    // Place the first point in the center.
    centerPoint._center = { x: width / 2, y: height / 2 };
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

    // Not hovering over anything yet.
    setHover(null);

    updateViewBox();
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
    const graphCenter = { x: width / 2, y: height / 2 };
    const sourceAngle = Math.atan2(
      sourceCenter.y - graphCenter.y,
      sourceCenter.x - graphCenter.x
    );

    const originalAngle = sourceAngle - arcAngle / 2;
    let angle = originalAngle;

    for (const targetPoint of targetPoints) {
      targetPoint._center = {
        x: graphCenter.x + Math.cos(angle) * targetRadius,
        y: graphCenter.y + Math.sin(angle) * targetRadius
      };
      targetPoint._layer = layer;
      targetPoint._placed = true;
      angle += deltaAngle;
    }

    // Resolve overlaps.
    let overlapFound = true;
    while (overlapFound) {
      overlapFound = false;

      let angle = originalAngle;
      for (const targetPoint of targetPoints) {
        if (pointOverlaps(targetPoint)) {
          overlapFound = true;
          targetPoint._layer++;
          const newRadius = targetPoint._layer * DELTA_RADIUS;
          targetPoint._center = {
            x: graphCenter.x + Math.cos(angle) * newRadius,
            y: graphCenter.y + Math.sin(angle) * newRadius
          };
        }
        angle += deltaAngle;
      }
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

    const { _center } = sourcePoint;
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

  function pointOverlaps(point) {
    const placedPoints = Object.values(pointMap).filter((p) => p._placed);
    for (const p of placedPoints) {
      // Don't check a point against itself.
      if (
        p.id !== point.id &&
        distanceBetweenPoints(point, p) < NODE_DIAMETER
      ) {
        return true;
      }
    }
    return false;
  }

  function setColor(kind, color) {
    setCssVariable(graphRef2, '--' + kind + '-color', color);
    if (kind === 'point') setPointColor(color);
    if (kind === 'edge') setEdgeColor(color);
    if (kind === 'text') setTextColor(color);
  }

  function renderControls() {
    return (
      <div className="controls hstack">
        {renderSelect(true)}
        {renderSelect(false)}
        <ColorPicker kind="point" setColor={setColor} value={pointColor} />
        <ColorPicker kind="edge" setColor={setColor} value={edgeColor} />
        <ColorPicker kind="text" setColor={setColor} value={textColor} />
        <div className="buttons">
          <button
            onClick={() => changeZoom(zoom + ZOOM_FACTOR)}
            title="zoom in"
          >
            <FontAwesomeIcon icon={faSearchPlus} size="lg" />
          </button>
          <button
            onClick={() => changeZoom(zoom - ZOOM_FACTOR)}
            title="zoom out"
          >
            <FontAwesomeIcon icon={faSearchMinus} size="lg" />
          </button>
          <button onClick={() => changeZoom(1)} title="reset zoom">
            <FontAwesomeIcon icon={faUndo} size="lg" />
          </button>
          <button
            disabled={!selectedPoint}
            onClick={() => changeCenter(selectedPoint)}
            title="change center point"
          >
            <FontAwesomeIcon icon={faCrosshairs} size="lg" />
          </button>
          <button
            onClick={() => changeCenter(points[0])}
            title="reset center point"
          >
            <FontAwesomeIcon icon={faSync} size="lg" />
          </button>
        </div>
      </div>
    );
  }

  function renderPopup(hover) {
    if (!hover || !hover._center) return null;

    const props = getObjectProps(hover);

    let { x, y } = hover._center;

    // Convert the center of the point or edge over which we are hovering
    // from SVG coordinates to screen coordinates.
    const svg = svgRef.current;
    var svgPoint = svg.createSVGPoint();
    svgPoint.x = x;
    svgPoint.y = y;
    const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM());

    // Position the popup.
    const style = {
      left: screenPoint.x + 'px',
      top: screenPoint.y + 'px'
    };

    return (
      <table className="popup" style={style}>
        <tbody>
          {props
            .filter((p) => typeof hover[p] !== 'object')
            .map((prop, index) => (
              <tr key={prop}>
                <td className="prop-name">{titleCase(prop)}</td>
                <td className="prop-value">{String(hover[prop])}</td>
              </tr>
            ))}
        </tbody>
      </table>
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
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {props.map((prop) => (
            <option key={prop} value={prop}>
              {titleCase(prop)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function updateViewBox() {
    // Determine the required width and height
    // to display all the points.
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    Object.values(pointMap).forEach((point) => {
      if (!point._placed) return;
      const { x, y } = point._center;
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

  const edgeMap = {};

  return (
    <div className="graph" ref={graphRef}>
      {renderControls()}
      <div className="container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          onMouseDown={() => setMouseDown(true)}
          onMouseMove={handleMove}
          onMouseLeave={() => setMouseDown(false)}
          onMouseUp={() => setMouseDown(false)}
          ref={svgRef}
          viewBox={viewBox}
          style={{ width: width * zoom + 'px', height: height * zoom + 'px' }}
        >
          {edges.map((edge, index) => (
            <Fragment key={'edge' + index}>
              <Edge
                edge={edge}
                edgeMap={edgeMap}
                hover={setHover}
                pointMap={pointMap}
                prop={selectedEdgeProp}
                radius={NODE_RADIUS}
              />
            </Fragment>
          ))}
          {points.map((point, index) => (
            <Fragment key={'point' + index}>
              <Point
                dragged={forceUpdate}
                edgeMap={edgeMap}
                hover={setHover}
                isSelected={point === selectedPoint}
                point={point}
                prop={selectedPointProp}
                radius={NODE_RADIUS}
                select={setSelectedPoint}
              />
            </Fragment>
          ))}
        </svg>
        {renderPopup(hover)}
      </div>
    </div>
  );
}

export default Graph;
