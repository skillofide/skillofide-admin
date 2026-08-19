import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAdmin } from './lib/auth';
import { loadCourses } from './lib/courses';
import Login from './pages/Login';
import UserList from './pages/Users/UserList';
import BulkImport from './pages/Import/BulkImport';
import TestList from './pages/Tests/TestList';
import TestEditor from './pages/Tests/TestEditor';
import McqList from './pages/McqBank/McqList';
import Results from './pages/Results/AttemptList';

const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) =>
  isAdmin() ? children : <Navigate to="/login" replace />;

const App: React.FC = () => {
  React.useEffect(() => {
    if (isAdmin()) loadCourses();
  }, []);

  return (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/users" element={<RequireAdmin><UserList /></RequireAdmin>} />
    <Route path="/import" element={<RequireAdmin><BulkImport /></RequireAdmin>} />
    <Route path="/tests" element={<RequireAdmin><TestList /></RequireAdmin>} />
    <Route path="/tests/:id" element={<RequireAdmin><TestEditor /></RequireAdmin>} />
    <Route path="/tests/:id/results" element={<RequireAdmin><Results /></RequireAdmin>} />
    <Route path="/mcq-bank" element={<RequireAdmin><McqList /></RequireAdmin>} />
    <Route path="*" element={<Navigate to={isAdmin() ? '/users' : '/login'} replace />} />
  </Routes>
  );
};

export default App;
