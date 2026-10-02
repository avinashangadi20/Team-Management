import React, { useState } from 'react';
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
  ChevronRight,
  Database,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string, meta?: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, isAdmin, isAM, isTL, isAgent, logout, quickSwitch } = useAuth();
  const [reportMenuOpen, setReportMenuOpen] = useState(true);
  const [perfMenuOpen, setPerfMenuOpen] = useState(true);

  const role = user?.role === 'TL' ? 'TEAM_LEADER' : user?.role || 'AGENT';

  const roleBadgeColors: Record<string, string> = {
    ADMIN: 'bg-purple-900/60 text-purple-300 border-purple-500/40',
    AM: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/40',
    TEAM_LEADER: 'bg-teal-900/60 text-teal-300 border-teal-500/40',
    AGENT: 'bg-blue-900/60 text-blue-300 border-blue-500/40'
  };

  const roleDisplayNames: Record<string, string> = {
    ADMIN: 'Administrator',
    AM: 'Assistant Manager',
    TEAM_LEADER: 'Team Leader',
    AGENT: 'Agent'
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-xs">
            OS
          </div>
          <div>
            <h1 className="font-black text-sm tracking-wide text-white">PERFORMANCE OS</h1>
            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Team Management</p>
          </div>
        </div>
      </div>

      {/* User Badge Info */}
      {user && (
        <div className="p-3.5 mx-3 my-2.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user.employee_id} &bull; {user.process}</p>
            </div>
            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md border shrink-0 ${roleBadgeColors[role] || roleBadgeColors.AGENT}`}>
              {role === 'TEAM_LEADER' ? 'TL' : role}
            </span>
          </div>
        </div>
      )}

      {/* Quick Switch Test Bar with 4 Roles */}
      <div className="px-4 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
        <span>Test Role Switcher</span>
      </div>
      <div className="px-3 pb-2.5 grid grid-cols-4 gap-1 text-[10px]">
        <button
          type="button"
          onClick={() => quickSwitch('ADMIN')}
          title="Switch to Admin (Sarah Jenkins)"
          className={`px-1.5 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
            role === 'ADMIN'
              ? 'bg-purple-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => quickSwitch('AM')}
          title="Switch to AM (Vikram Malhotra)"
          className={`px-1.5 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
            role === 'AM'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => quickSwitch('TEAM_LEADER')}
          title="Switch to TL (Amit Verma)"
          className={`px-1.5 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
            role === 'TEAM_LEADER'
              ? 'bg-teal-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          TL
        </button>
        <button
          type="button"
          onClick={() => quickSwitch('AGENT')}
          title="Switch to Agent (Rahul Sharma)"
          className={`px-1.5 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
            role === 'AGENT'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Agent
        </button>
      </div>

      {/* Navigation Links Grouped By Role */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
        {/* ======================================================== */}
        {/* 1. ADMIN NAVIGATION */}
        {/* ======================================================== */}
        {role === 'ADMIN' && (
          <>
            <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Admin Portal
            </div>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Dashboard</span>
              </div>
              {currentTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>

            <button
              onClick={() => onSelectTab('users')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'users' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>User Management</span>
              </div>
              {currentTab === 'users' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>

            <button
              onClick={() => onSelectTab('approvals')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'approvals' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Pending Approvals</span>
              </div>
              {currentTab === 'approvals' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>

            <button
              onClick={() => onSelectTab('employees')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'employees' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span>Employees</span>
              </div>
              {currentTab === 'employees' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>

            <button
              onClick={() => onSelectTab('am-management')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'am-management' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <span>AM Management</span>
              </div>
              {currentTab === 'am-management' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>

            <button
              onClick={() => onSelectTab('tl-management')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'tl-management' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-teal-400" />
                <span>TL Management</span>
              </div>
              {currentTab === 'tl-management' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>

            <button
              onClick={() => onSelectTab('teams')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'teams' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Team Management</span>
              </div>
              {currentTab === 'teams' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>

            {/* Report Management Submenu */}
            <div className="pt-2">
              <button
                onClick={() => setReportMenuOpen(!reportMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Report Management</span>
                </div>
                {reportMenuOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>

              {reportMenuOpen && (
                <div className="pl-4 space-y-1 mt-1">
                  <button
                    onClick={() => onSelectTab('upload-reports')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      currentTab === 'upload-reports' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                    <span>Upload Report</span>
                  </button>
                  <button
                    onClick={() => onSelectTab('processing-logs')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      currentTab === 'processing-logs' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Processing Logs</span>
                  </button>
                </div>
              )}
            </div>

            {/* Performance Reports Submenu */}
            <div className="pt-2">
              <button
                onClick={() => setPerfMenuOpen(!perfMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Performance Reports</span>
                </div>
                {perfMenuOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>

              {perfMenuOpen && (
                <div className="pl-4 space-y-1 mt-1">
                  <button
                    onClick={() => onSelectTab('performance', { view: 'daily' })}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      currentTab === 'performance' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Daily Performance</span>
                  </button>
                  <button
                    onClick={() => onSelectTab('performance', { view: 'weekly' })}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    <span>Weekly Performance</span>
                  </button>
                  <button
                    onClick={() => onSelectTab('performance', { view: 'monthly' })}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    <span>Monthly Performance</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <button
                onClick={() => onSelectTab('feedback-coaching')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'feedback-coaching' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>Feedback &amp; Coaching</span>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('attendance')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'attendance' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-teal-400" />
                  <span>Attendance</span>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('audit-logs')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'audit-logs' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Audit Logs</span>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('kpis')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'kpis' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Settings &amp; KPIs</span>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* 2. AM (ASSISTANT MANAGER) NAVIGATION */}
        {/* ======================================================== */}
        {role === 'AM' && (
          <>
            <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Assistant Manager Portal
            </div>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-indigo-300" />
                <span>AM Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('teams')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'teams' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>My Teams</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('tl-management')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'tl-management' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-teal-400" />
                <span>My Team Leaders</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('employees')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'employees' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Assigned Agents</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('upload-reports')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'upload-reports' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Upload Report</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('processing-logs')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'processing-logs' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-slate-400" />
                <span>Processing Logs</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('performance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'performance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Performance Reports</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('feedback-coaching')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'feedback-coaching' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Feedback &amp; Coaching</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('attendance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'attendance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-teal-400" />
                <span>Attendance Overview</span>
              </div>
            </button>
          </>
        )}

        {/* ======================================================== */}
        {/* 3. TL (TEAM LEADER) NAVIGATION */}
        {/* ======================================================== */}
        {role === 'TEAM_LEADER' && (
          <>
            <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Team Leader Portal
            </div>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'dashboard' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-teal-300" />
                <span>TL Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('employees')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'employees' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>My Team Agents</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('performance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'performance' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Team Performance</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('acd-calls')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'acd-calls' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-indigo-400" />
                <span>ACD Call Details</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('feedback-coaching')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'feedback-coaching' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Feedback &amp; Coaching</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('attendance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'attendance' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-teal-400" />
                <span>Team Attendance</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('tl-activities')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'tl-activities' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>TL Daily Activities</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('upload-reports')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'upload-reports' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Upload Team Report</span>
              </div>
            </button>
          </>
        )}

        {/* ======================================================== */}
        {/* 4. AGENT NAVIGATION */}
        {/* ======================================================== */}
        {role === 'AGENT' && (
          <>
            <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Agent Portal
            </div>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-blue-300" />
                <span>My Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('my-profile')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'my-profile' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>My 360&deg; Profile</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('performance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'performance' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>My Daily Performance</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('acd-calls')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'acd-calls' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-teal-400" />
                <span>My ACD Calls</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('feedback-coaching')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'feedback-coaching' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>My Feedback &amp; Coaching</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('attendance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'attendance' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-amber-400" />
                <span>My Attendance</span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-1">
        <button
          onClick={() => onSelectTab('my-profile')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            currentTab === 'my-profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-4 h-4 text-slate-400" />
          <span>My Profile &amp; Account</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
