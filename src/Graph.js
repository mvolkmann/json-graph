import {useCallback, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faSearchMinus,
  faSearchPlus,
  faUndo
} from '@fortawesome/free-solid-svg-icons';
import './Graph.scss';

const HEIGHT = 300;
const HIDDEN_PROPS = new Set(['center', 'id', 'source', 'target']);
const NODE_RADIUS = 20;
const WIDTH = 800;
const ZOOM_FACTOR = 0.1;

function Graph({data, edgeProp, pointProp}) {
  console.log('Graph.js Graph: entered');
  const {edges, points} = data;
  const [height, setHeight] = useState(0);
  const [hoverEdge, setHoverEdge] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(points[0]);
  const [layoutComplete, setLayoutComplete] = useState(false);
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
  }, []);

  const edgeProps = getObjectProps(edges[0]);
  const pointProps = getObjectProps(points[0]);
  const pointMap = points.reduce((acc, point) => {
    acc[point.id] = point;
    return acc;
  }, {});

  if (!layoutComplete) {
    layout();
    setLayoutComplete(true);
  }

  function getObjectProps(object) {
    return Object.keys(object)
      .filter(key => !HIDDEN_PROPS.has(key))
      .sort();
  }

  function layout() {
    for (const point of points) {
      point.center = {
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT
      };
    }

    for (const edge of edges) {
      const p1 = pointMap[edge.source].center;
      const p2 = pointMap[edge.target].center;
      edge.center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      };
    }

    setHoverPoint(points[0]);
  }

  function edgeHover(edge) {
    setHoverEdge(edge);
  }

  function pointHover(point) {
    setHoverPoint(point);
  }

  function renderEdge(edge, index) {
    const {source, target} = edge;
    const p1 = pointMap[source].center;
    const p2 = pointMap[target].center;
    if (!p1 || !p2) return null;
    return (
      <g>
        <line
          key={'line' + index}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          onMouseEnter={() => edgeHover(edge)}
          onMouseLeave={() => setHoverEdge(null)}
        />
        ;
        <text key={'text' + index} x={edge.center.x} y={edge.center.y}>
          {edge[selectedEdgeProp]}
        </text>
      </g>
    );
  }

  function renderPoint(point) {
    const {center} = point;
    if (!center) return null;
    return (
      <g>
        <circle
          key={'circle' + point.id}
          cx={center.x}
          cy={center.y}
          r={NODE_RADIUS}
          onMouseEnter={() => pointHover(point)}
          onMouseLeave={() => {
            console.log('Graph.js renderPoint: got mouse leave');
            setHoverPoint(null);
          }}
        />
        {/* <text key={'text' + point.id} x={center.x} y={center.y}>
          {point[selectedPointProp]}
        </text> */}
      </g>
    );
  }

  function renderEdgePopup(edge) {
    return renderPopup(edge, edgeProps);
  }

  function renderPointPopup(point) {
    return renderPopup(point, pointProps);
  }

  function renderPopup(hoverObject, props) {
    if (!hoverObject) return null;
    const {x, y} = hoverObject.center;
    return (
      <g className="popup">
        <rect x={x} y={y} width="60" height={5 + props.length * 10} />
        <text x={x} y={y}>
          {props.map((prop, index) => (
            <tspan x={x + 5} y={y + (index + 1) * 10}>
              {prop}: {hoverObject[prop]}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  function renderSelect(forPoints) {
    const label = (forPoints ? 'Point' : 'Edge') + ' Property';
    const key = (forPoints ? 'point' : 'edge') + '-select';
    const keys = forPoints ? pointProps : edgeProps;
    const selected = forPoints ? selectedPointProp : selectedEdgeProp;
    const setSelected = forPoints ? setSelectedPointProp : setSelectedEdgeProp;
    return (
      <div className="select-wrapper" key={key}>
        <p className="label">{label}</p>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {keys.map(key => (
            <option>{key}</option>
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
        <button onClick={() => setZoom(zoom + ZOOM_FACTOR)}>
          <FontAwesomeIcon icon={faSearchPlus} size="lg" />
        </button>
        <button onClick={() => setZoom(zoom - ZOOM_FACTOR)}>
          <FontAwesomeIcon icon={faSearchMinus} size="lg" />
        </button>
        <button onClick={() => setZoom(1)}>
          <FontAwesomeIcon icon={faUndo} size="lg" />
        </button>
      </div>
      {/* <div className="row">
        hoverPoint = {JSON.stringify(hoverPoint)}; hoverEdge ={' '}
        {JSON.stringify(hoverEdge)}
      </div> */}
      <div className="container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
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
