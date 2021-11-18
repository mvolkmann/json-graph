import Graph from './Graph.jsx';
import './App.css';
import data from './graph.json';
//import data from './graph2.json';

function App() {
  function getProp(collection, defaultProp) {
    const keys = Object.keys(data[collection][0]).filter(
      key => key !== 'source' && key !== 'target'
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
