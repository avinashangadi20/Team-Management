import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  UploadCloud,
  TrendingUp,
  PhoneCall,
  MessageSquare,
  Award,
  CalendarCheck,
  Mail,
  ShieldCheck,
  Sliders,
  LogOut,
  UserCheck,
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, isAdmin, isTL, isAgent, logout, quickSwitch } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TEAM_LEADER', 'AGENT'] },
    { id: 'my-profile', label: 'My 360 Performance', icon: UserCheck, roles: ['AGENT'] },
    { id: 'performance', label: 'Performance Analytics', icon: TrendingUp, roles: ['ADMIN', 'TEAM_LEADER', 'AGENT'] },
    { id: 'upload-reports', label: 'Report Upload Center', icon: UploadCloud, roles: ['ADMIN', 'TEAM_LEADER'] },
    { id: 'acd-calls', label: 'ACD Call Explorer', icon: PhoneCall, roles: ['ADMIN', 'TEAM_LEADER', 'AGENT'] },
    { id: 'feedback-coaching', label: 'Feedback & Coaching', icon: MessageSquare, roles: ['ADMIN', 'TEAM_LEADER', 'AGENT'] },
    { id: 'attendance', label: 'Attendance & Shifts', icon: CalendarCheck, roles: ['ADMIN', 'TEAM_LEADER', 'AGENT'] },
    { id: 'tl-activities', label: 'TL Activity Logger', icon: Award, roles: ['ADMIN', 'TEAM_LEADER'] },
    // Admin specific
    { id: 'users', label: 'User Directory & Approvals', icon: Users, roles: ['ADMIN'] },
    { id: 'teams', label: 'Team & TL Management', icon: Building2, roles: ['ADMIN'] },
    { id: 'emails', label: 'Automated Email Reports', icon: Mail, roles: ['ADMIN', 'TEAM_LEADER'] },
    { id: 'kpis', label: 'KPI Targets & Benchmarks', icon: Sliders, roles: ['ADMIN'] },
    { id: 'audit-logs', label: 'Security & Audit Trail', icon: ShieldCheck, roles: ['ADMIN'] }
  ];

  const visibleNav = navItems.filter((item) => user && item.roles.includes(user.role));

  const roleBadgeColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    TEAM_LEADER: 'bg-teal-100 text-teal-800 border-teal-200',
    AGENT: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            EP
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">OPERATIONAL</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Performance OS</p>
          </div>
        </div>
      </div>

      {/* User Badge Info */}
      {user && (
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.employee_id} &bull; {user.process}</p>
            </div>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${roleBadgeColors[user.role]}`}>
              {user.role === 'TEAM_LEADER' ? 'TL' : user.role}
            </span>
          </div>
        </div>
      )}

      {/* Quick Switch Test Bar */}
      <div className="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
        <span>Quick Switch Role</span>
      </div>
      <div className="px-3 pb-3 grid grid-cols-3 gap-1.5 text-[11px]">
        <button
          type="button"
          onClick={() => quickSwitch('ADMIN')}
          title="Switch to Admin (Sarah Jenkins)"
          className={`px-2 py-1.5 rounded font-medium text-center transition-all ${
            user?.role === 'ADMIN'
              ? 'bg-purple-600 text-white font-semibold shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => quickSwitch('TEAM_LEADER')}
          title="Switch to TL (Amit Verma)"
          className={`px-2 py-1.5 rounded font-medium text-center transition-all ${
            user?.role === 'TEAM_LEADER'
              ? 'bg-teal-600 text-white font-semibold shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          TL
        </button>
        <button
          type="button"
          onClick={() => quickSwitch('AGENT')}
          title="Switch to Agent (Rahul Sharma)"
          className={`px-2 py-1.5 rounded font-medium text-center transition-all ${
            user?.role === 'AGENT'
              ? 'bg-blue-600 text-white font-semibold shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Agent
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Management Modules
        </div>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>
          );
        })}
      </div>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
