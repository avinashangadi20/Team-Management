import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, RefreshCw, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Notification } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { user, teamName } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoadingNotifs(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 30000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      if (link) {
        const cleanTab = link.replace('/', '');
        onSelectTab(cleanTab);
        setShowNotifMenu(false);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const titles: Record<string, string> = {
    dashboard: 'Operations Command Center',
    'my-profile': 'Agent 360 Performance Dossier',
    performance: 'Enterprise Performance Analytics',
    'upload-reports': 'Operational Report Ingestion Pipeline',
    'acd-calls': 'ACD Call Details & Records',
    'feedback-coaching': 'Partner Feedback & Coaching Lifecycle',
    attendance: 'Shift Attendance & Schedule Adherence',
    'tl-activities': 'Team Leader Operations Logger',
    users: 'Employee Master & Registration Approvals',
    teams: 'Team Structures & TL Assignments',
    emails: 'Automated Performance Email Dispatcher',
    kpis: 'KPI Targets & Tolerance Configurations',
    'audit-logs': 'Immutable Security & Audit Trail'
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {titles[currentTab] || 'Management System'}
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Process: <strong>{user?.process || 'Operations'}</strong></span>
          {teamName && (
            <>
              <span>&bull;</span>
              <span className="text-blue-600 font-semibold">{teamName}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {unreadCount} unread
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.link)}
                      className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                        !n.is_read ? 'bg-blue-50/50 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-slate-900">{n.title}</span>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1"></span>}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Name */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {user?.full_name?.slice(0, 2) || 'US'}
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-bold text-slate-900">{user?.full_name}</div>
            <div className="text-[11px] text-slate-500 font-mono">{user?.employee_id}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
