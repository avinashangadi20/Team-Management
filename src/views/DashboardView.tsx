import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardView } from './dashboards/AdminDashboardView';
import { AMDashboardView } from './dashboards/AMDashboardView';
import { TLDashboardView } from './dashboards/TLDashboardView';
import { AgentDashboardView } from './dashboards/AgentDashboardView';

interface DashboardViewProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboardView onNavigate={onNavigate} />;
  }

  if (user.role === 'AM') {
    return <AMDashboardView onNavigate={onNavigate} />;
  }

  if (user.role === 'TEAM_LEADER' || user.role === 'TL') {
    return <TLDashboardView onNavigate={onNavigate} />;
  }

  return <AgentDashboardView onNavigate={onNavigate} />;
};
