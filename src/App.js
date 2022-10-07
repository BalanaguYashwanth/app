import './App.css';
import { BrowserRouter as Router, Route,Routes } from "react-router-dom";
import Home from './Pages/Home';
import { Admin } from './Pages/Admin';

function App() {
  return (
    <>
      <Router>
        <main className="py-3">
          <Routes>
            <Route path="/" element={<Home />} exact />
            <Route path="/admin" element={<Admin />} exact />
          </Routes>
        </main>
      </Router>
    </>
  );
}

export default App;