import React from 'react';
import Graph from './graph/Graph-old.jsx';
import data from './graph/graph.json';

import './App.css';

function App() {
  function getProp(collection, defaultProp) {
    const keys = Object.keys(data[collection][0]).filter(
      (key) => key !== 'source' && key !== 'target'
    );
    return keys.includes(defaultProp) ? defaultProp : keys[0];
  }

  const pointProp = getProp('points', 'methodName');
  const edgeProp = getProp('edges', 'time');
  return (
    <div className="App">
      <Graph data={data} edgeProp={edgeProp} pointProp={pointProp} />
    </div>
  );
}

export default App;
