import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { ReportUploadView } from './views/ReportUploadView';
import { PerformanceView } from './views/PerformanceView';
import { Employee360View } from './views/Employee360View';
import { UserManagementView } from './views/UserManagementView';
import { TeamManagementView } from './views/TeamManagementView';
import { FeedbackCoachingView } from './views/FeedbackCoachingView';
import { EmailSystemView } from './views/EmailSystemView';
import { ACDCallsView } from './views/ACDCallsView';
import { AttendanceView } from './views/AttendanceView';
import { TLActivitiesView } from './views/TLActivitiesView';
import { KPISettingsView } from './views/KPISettingsView';
import { AuditLogsView } from './views/AuditLogsView';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Initializing Performance OS...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleSelectTab = (tab: string) => {
    setSelectedEmpId(null);
    setCurrentTab(tab);
  };

  const handleOpen360 = (empId: string) => {
    setSelectedEmpId(empId);
    setCurrentTab('my-profile');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentTab={currentTab} onSelectTab={handleSelectTab} />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && <DashboardView onNavigate={handleSelectTab} />}
          {currentTab === 'my-profile' && (
            <Employee360View
              employeeId={selectedEmpId || undefined}
              onBack={selectedEmpId ? () => handleSelectTab('performance') : undefined}
            />
          )}
          {currentTab === 'performance' && <PerformanceView onSelectEmployee={handleOpen360} />}
          {currentTab === 'upload-reports' && <ReportUploadView />}
          {currentTab === 'acd-calls' && <ACDCallsView />}
          {currentTab === 'feedback-coaching' && <FeedbackCoachingView />}
          {currentTab === 'attendance' && <AttendanceView />}
          {currentTab === 'tl-activities' && <TLActivitiesView />}
          {currentTab === 'users' && <UserManagementView />}
          {currentTab === 'teams' && <TeamManagementView />}
          {currentTab === 'emails' && <EmailSystemView />}
          {currentTab === 'kpis' && <KPISettingsView />}
          {currentTab === 'audit-logs' && <AuditLogsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
