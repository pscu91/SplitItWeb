import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateSettlementPage from './pages/CreateSettlementPage';
import CreateParticipantsPage from './pages/CreateParticipantsPage';
import CreateResultPage from './pages/CreateResultPage';
import SettlementDetailPage from './pages/SettlementDetailPage';
import CreateDeductionPage from './pages/CreateDeductionPage';
import './App.css';

function App() {
  return (
    <Router basename="/SplitItWeb/">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateSettlementPage />} />
        <Route
          path="/create/participants"
          element={<CreateParticipantsPage />}
        />
        <Route path="/create/deduction" element={<CreateDeductionPage />} />
        <Route path="/create/result" element={<CreateResultPage />} />
        <Route path="/settlement/:id" element={<SettlementDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
