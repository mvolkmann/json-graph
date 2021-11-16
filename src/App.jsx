import Graph from './Graph.jsx';
import './App.css';
import data from './graph.json';
//import data from './graph2.json';

function App() {
  return (
    <div className="App">
      <Graph data={data} edgeProp="time" pointProp="name" />
    </div>
  );
}

export default App;
