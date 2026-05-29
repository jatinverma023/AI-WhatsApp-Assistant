import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ChatViewer from './pages/ChatViewer';
import SystemStatus from './pages/SystemStatus';
import Search from './pages/Search';
import Memory from './pages/Memory';
import Conversations from './pages/Conversations';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<ChatViewer />} />
          <Route path="search" element={<Search />} />
          <Route path="status" element={<SystemStatus />} />
          <Route path="memory" element={<Memory />} />
          <Route path="conversations" element={<Conversations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
