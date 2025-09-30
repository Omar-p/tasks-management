import { Routes, Route, Navigate } from 'react-router-dom';
import { SigninForm } from './SigninForm';
import { SignupForm } from './SignupForm';
import { ThemeToggle } from '@/views/components';

export const AuthContainer = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface overflow-hidden">
        <div className="w-full px-4 py-4 flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate min-w-0">Tasks Management</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Routes>
            <Route path="/signin" element={<SigninForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/" element={<Navigate to="/signin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};