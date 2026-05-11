
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AllNotifications from './pages/AllNotifications';
import PriorityInbox from './pages/PriorityInbox';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<AllNotifications />} />
          <Route path="/priority" element={<PriorityInbox />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
