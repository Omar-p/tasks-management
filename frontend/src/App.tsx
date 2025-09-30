import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthContainer } from '@/views/containers/auth';
import { DashboardContainer } from '@/views/containers/dashboard';
import { TasksContainer } from '@/views/containers/tasks';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <main>
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/dashboard" element={<DashboardContainer />} />
              <Route path="/tasks" element={<TasksContainer />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth/*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/auth/*" element={<AuthContainer />} />
              <Route path="*" element={<Navigate to="/auth/signin" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;