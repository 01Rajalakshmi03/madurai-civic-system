import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

import CitizenDashboard from '../components/Citizen/CitizenDashboard';
import NewComplaint from '../components/Citizen/NewComplaint';
import MyComplaints from '../components/Citizen/MyComplaints';
import TrackComplaint from '../components/Citizen/TrackComplaint';

import WardDashboard from '../components/Ward/WardDashboard';
import AssignedComplaints from '../components/Ward/AssignedComplaints';
import WardPerformance from '../components/Ward/WardPerformance';

import CorpDashboard from '../components/Corporation/CorpDashboard';
import CorpComplaints from '../components/Corporation/CorpComplaints';
import CorpAnalytics from '../components/Corporation/CorpAnalytics';
import CorpAssign from '../components/Corporation/CorpAssign';
import WardPerformanceView from '../components/Corporation/WardPerformanceView';

import AdminDashboard from '../components/Admin/AdminDashboard';
import UserManagement from '../components/Admin/UserManagement';
import WardManagement from '../components/Admin/WardManagement';
import OfficerManagement from '../components/Admin/OfficerManagement';
import AdminComplaints from '../components/Admin/AdminComplaints';
import BlockchainExplorer from '../components/Admin/BlockchainExplorer';
import AIAnalytics from '../components/Admin/AIAnalytics';

import MapView from '../components/Map/MapView';
import NotificationsPage from '../components/Notifications/NotificationsPage';
import ReportsPage from '../components/Reports/ReportsPage';
import SettingsPage from '../components/Admin/SettingsPage';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const role = user?.role;

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            {/* Citizen Routes */}
            {role === 'citizen' && (
              <>
                <Route index element={<CitizenDashboard />} />
                <Route path="new-complaint" element={<NewComplaint />} />
                <Route path="my-complaints" element={<MyComplaints />} />
                <Route path="track" element={<TrackComplaint />} />
                <Route path="track/:id" element={<TrackComplaint />} />
                <Route path="map" element={<MapView />} />
              </>
            )}

            {/* Ward Member Routes */}
            {role === 'ward_member' && (
              <>
                <Route index element={<WardDashboard />} />
                <Route path="assigned" element={<AssignedComplaints />} />
                <Route path="performance" element={<WardPerformance />} />
                <Route path="map" element={<MapView />} />
              </>
            )}

            {/* Corporation Official Routes */}
            {role === 'corporation_official' && (
              <>
                <Route index element={<CorpDashboard />} />
                <Route path="complaints" element={<CorpComplaints />} />
                <Route path="assign" element={<CorpAssign />} />
                <Route path="analytics" element={<CorpAnalytics />} />
                <Route path="ward-performance" element={<WardPerformanceView />} />
                <Route path="map" element={<MapView />} />
              </>
            )}

            {/* Admin Routes */}
            {role === 'admin' && (
              <>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="wards" element={<WardManagement />} />
                <Route path="officials" element={<OfficerManagement />} />
                <Route path="complaints" element={<AdminComplaints />} />
                <Route path="blockchain" element={<BlockchainExplorer />} />
                <Route path="analytics" element={<AIAnalytics />} />
                <Route path="map" element={<MapView />} />
                <Route path="settings" element={<SettingsPage />} />
              </>
            )}

            {/* Common Routes */}
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reports" element={<ReportsPage />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
