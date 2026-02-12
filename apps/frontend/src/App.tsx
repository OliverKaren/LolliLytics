import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@components/common/layout/MainLayout';
import { DashboardPage } from '@pages/Dashboard/DashboardPage';
import { DraftIntelligencePage } from '@pages/DraftIntelligence/DraftIntelligencePage';
import { PerformancePage } from '@pages/Performance/PerformancePage';
import { TiltDetectionPage } from '@pages/TiltDetection/TiltDetectionPage';
import { SmurfDetectionPage } from '@pages/SmurfDetection/SmurfDetectionPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/draft" element={<DraftIntelligencePage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/tilt" element={<TiltDetectionPage />} />
        <Route path="/smurf" element={<SmurfDetectionPage />} />
      </Route>
    </Routes>
  );
}
