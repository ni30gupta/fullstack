import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context';
import { ProtectedRoute } from './components/auth';
import { AdminHome, Login, Register } from './pages';
import Member from './pages/Member';
import { Layout } from './components/layout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes: use a parent Route with element={<ProtectedRoute/>} to protect multiple child routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<AdminHome />} />
            <Route path="/members" element={<Member />} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
