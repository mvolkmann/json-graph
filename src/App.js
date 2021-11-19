import Graph from './components/graph/Graph';
import './App.css';
import data from './graph-big.json';
//import data from './graph-test.json';

function App() {
  return (
    <div className="App">
      <Graph data={data} edgeProp="time" pointProp="name" />
    </div>
  );
}

export default App;
