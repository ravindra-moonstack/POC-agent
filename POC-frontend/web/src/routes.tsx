import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Clients = React.lazy(() => import('./pages/Clients'));
const ClientDetails = React.lazy(() => import('./pages/ClientDetails'));
const Reports = React.lazy(() => import('./pages/Reports'));
const ReportDetails = React.lazy(() => import('./pages/ReportDetails'));
const Profile = React.lazy(() => import('./pages/Profile'));

const AppRoutes = () => {
  return (
    <React.Suspense fallback={<div className="flex-center h-full">Loading...</div>}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes; 