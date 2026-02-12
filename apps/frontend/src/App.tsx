import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@components/common/layout/MainLayout';
import { ProtectedRoute } from '@components/common/auth/ProtectedRoute';
import { LoginPage } from '@pages/Auth/LoginPage';
import { RegisterPage } from '@pages/Auth/RegisterPage';
import { DashboardPage } from '@pages/Dashboard/DashboardPage';
import { DraftIntelligencePage } from '@pages/DraftIntelligence/DraftIntelligencePage';
import { PerformancePage } from '@pages/Performance/PerformancePage';
import { TiltDetectionPage } from '@pages/TiltDetection/TiltDetectionPage';
import { SmurfDetectionPage } from '@pages/SmurfDetection/SmurfDetectionPage';
import { SettingsPage } from '@pages/Settings/SettingsPage';

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ──────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected routes (require JWT) ─────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"   element={<DashboardPage />} />
        <Route path="/draft"       element={<DraftIntelligencePage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/tilt"        element={<TiltDetectionPage />} />
        <Route path="/smurf"       element={<SmurfDetectionPage />} />
        <Route path="/settings"    element={<SettingsPage />} />
      </Route>

      {/* ── Fallback ────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
