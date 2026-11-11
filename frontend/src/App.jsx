import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Spinner } from './components/ui';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import NewRequest from './pages/student/NewRequest';
import MyRequests from './pages/student/MyRequests';
import RequestDetails from './pages/shared/RequestDetails';
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AllRequests from './pages/admin/AllRequests';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute role="student"><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/requests/new" element={<NewRequest />} />
        <Route path="/requests" element={<MyRequests />} />
        <Route path="/requests/:id" element={<RequestDetails />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/requests" element={<AllRequests />} />
        <Route path="/admin/requests/:id" element={<RequestDetails />} />
        <Route path="/admin/notifications" element={<Notifications />} />
        <Route path="/admin/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
