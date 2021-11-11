import Graph from './Graph';
import './App.css';
import data from './graph.json';

function App() {
  return (
    <div className="App">
      <Graph data={data} edgeProp="time" pointProp="size" />
    </div>
  );
}

export default App;
