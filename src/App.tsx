import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { ReportUploadView } from './views/ReportUploadView';
import { ProcessingLogsView } from './views/ProcessingLogsView';
import { PerformanceView } from './views/PerformanceView';
import { Employee360View } from './views/Employee360View';
import { UserManagementView } from './views/UserManagementView';
import { PendingApprovalsView } from './views/PendingApprovalsView';
import { AMManagementView } from './views/AMManagementView';
import { TLManagementView } from './views/TLManagementView';
import { TeamManagementView } from './views/TeamManagementView';
import { FeedbackCoachingView } from './views/FeedbackCoachingView';
import { EmailSystemView } from './views/EmailSystemView';
import { ACDCallsView } from './views/ACDCallsView';
import { AttendanceView } from './views/AttendanceView';
import { TLActivitiesView } from './views/TLActivitiesView';
import { KPISettingsView } from './views/KPISettingsView';
import { AuditLogsView } from './views/AuditLogsView';
import { DatabaseView } from './views/DatabaseView';

function getRoleDashboardPath(role?: string): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'AM') return '/am/dashboard';
  if (role === 'TEAM_LEADER' || role === 'TL') return '/tl/dashboard';
  return '/agent/dashboard';
}

function MainApp() {
  const { user, loading, redirectUrl } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Sync with browser URL pathname on mount and route change
  useEffect(() => {
    if (!user) return;

    const path = window.location.pathname;
    const roleDash = getRoleDashboardPath(user.role);

    // If on a specific role dashboard URL
    if (path === '/admin/dashboard' || path === '/am/dashboard' || path === '/tl/dashboard' || path === '/agent/dashboard') {
      // Validate role permissions:
      if (path === '/admin/dashboard' && user.role !== 'ADMIN') {
        window.history.replaceState(null, '', roleDash);
      } else if (path === '/am/dashboard' && user.role !== 'AM' && user.role !== 'ADMIN') {
        window.history.replaceState(null, '', roleDash);
      } else if (path === '/tl/dashboard' && user.role === 'AGENT') {
        window.history.replaceState(null, '', roleDash);
      }
      setCurrentTab('dashboard');
      return;
    }

    if (path === '/admin/users' || path === '/users') {
      setCurrentTab('users');
    } else if (path === '/admin/approvals' || path === '/approvals') {
      setCurrentTab('approvals');
    } else if (path === '/admin/am-management') {
      setCurrentTab('am-management');
    } else if (path === '/admin/tl-management') {
      setCurrentTab('tl-management');
    } else if (path === '/admin/teams' || path === '/teams') {
      setCurrentTab('teams');
    } else if (path === '/admin/upload-report' || path === '/upload-reports') {
      setCurrentTab('upload-reports');
    } else if (path === '/admin/processing-logs' || path === '/processing-logs') {
      setCurrentTab('processing-logs');
    } else if (path === '/performance') {
      setCurrentTab('performance');
    } else if (path === '/feedback-coaching') {
      setCurrentTab('feedback-coaching');
    } else if (path === '/attendance') {
      setCurrentTab('attendance');
    } else if (path === '/audit-logs') {
      setCurrentTab('audit-logs');
    } else if (path === '/settings' || path === '/kpis') {
      setCurrentTab('kpis');
    } else if (path === '/profile' || path === '/my-profile') {
      setCurrentTab('my-profile');
    } else if (path === '/' || path === '') {
      window.history.replaceState(null, '', roleDash);
      setCurrentTab('dashboard');
    }
  }, [user]);

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

  const handleSelectTab = (tab: string, meta?: any) => {
    setSelectedEmpId(meta?.employee_id || null);
    setCurrentTab(tab);

    // Update browser URL accordingly
    const roleDash = getRoleDashboardPath(user.role);
    if (tab === 'dashboard') {
      window.history.pushState(null, '', roleDash);
    } else if (tab === 'users') {
      window.history.pushState(null, '', '/admin/users');
    } else if (tab === 'approvals') {
      window.history.pushState(null, '', '/admin/approvals');
    } else if (tab === 'am-management') {
      window.history.pushState(null, '', '/admin/am-management');
    } else if (tab === 'tl-management') {
      window.history.pushState(null, '', '/admin/tl-management');
    } else if (tab === 'teams') {
      window.history.pushState(null, '', '/teams');
    } else if (tab === 'upload-reports') {
      window.history.pushState(null, '', '/upload-reports');
    } else if (tab === 'processing-logs') {
      window.history.pushState(null, '', '/processing-logs');
    } else if (tab === 'performance' || tab.startsWith('performance-')) {
      window.history.pushState(null, '', '/performance');
    } else if (tab === 'feedback-coaching') {
      window.history.pushState(null, '', '/feedback-coaching');
    } else if (tab === 'attendance') {
      window.history.pushState(null, '', '/attendance');
    } else if (tab === 'audit-logs') {
      window.history.pushState(null, '', '/audit-logs');
    } else if (tab === 'kpis') {
      window.history.pushState(null, '', '/settings');
    } else if (tab === 'my-profile') {
      window.history.pushState(null, '', '/my-profile');
    }
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
          {(currentTab === 'performance' || currentTab.startsWith('performance-')) && (
            <PerformanceView onSelectEmployee={handleOpen360} />
          )}
          {currentTab === 'upload-reports' && <ReportUploadView />}
          {currentTab === 'processing-logs' && <ProcessingLogsView />}
          {currentTab === 'acd-calls' && <ACDCallsView />}
          {currentTab === 'feedback-coaching' && <FeedbackCoachingView />}
          {currentTab === 'attendance' && <AttendanceView />}
          {currentTab === 'tl-activities' && <TLActivitiesView />}
          {currentTab === 'users' && <UserManagementView />}
          {currentTab === 'employees' && <UserManagementView />}
          {currentTab === 'approvals' && <PendingApprovalsView />}
          {currentTab === 'am-management' && <AMManagementView />}
          {currentTab === 'tl-management' && <TLManagementView />}
          {currentTab === 'teams' && <TeamManagementView />}
          {currentTab === 'emails' && <EmailSystemView />}
          {currentTab === 'kpis' && <KPISettingsView />}
          {currentTab === 'database' && <DatabaseView />}
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
