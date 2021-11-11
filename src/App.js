import Graph from './Graph';
import './App.css';
import data from './graph.json';

function App() {
  return (
    <div className="App">
      <Graph data={data} edgeProp="time" pointProp="name" />
    </div>
  );
}

export default App;
