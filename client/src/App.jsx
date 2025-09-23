// File: client/src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SpaceApp from './SpaceApp';
import ChatApp from './ChatApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<SpaceApp />} />
        <Route path="/" element={<ChatApp />} />
      </Routes>
    </Router>
  );
}

export default App;
