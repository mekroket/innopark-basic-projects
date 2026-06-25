import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/Toast';

import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { SocialFeed } from './pages/SocialFeed';
import { AICompanion } from './pages/AICompanion';
import { EventExplorer } from './pages/EventExplorer';
import { EventDetail } from './pages/EventDetail';
import { CommunityHub } from './pages/CommunityHub';
import { CommunityDetail } from './pages/CommunityDetail';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AppProvider>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><Layout><SocialFeed /></Layout></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><Layout><AICompanion /></Layout></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Layout><EventExplorer /></Layout></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><Layout><EventDetail /></Layout></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Layout><CommunityHub /></Layout></ProtectedRoute>} />
          <Route path="/community/:id" element={<ProtectedRoute><Layout><CommunityDetail /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;