import React, { useState } from 'react';
import { Shield, Lock, User, Mail, Phone, Building, Briefcase, Calendar, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthView: React.FC = () => {
  const { login, register, quickSwitch } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@12345');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regData, setRegData] = useState({
    full_name: '',
    employee_id: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    designation: 'Agent',
    team_id: 'team-alpha',
    process: 'Inbound Support',
    reporting_tl_id: 'usr-tl-1',
    date_of_joining: new Date().toISOString().split('T')[0]
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login({ username, password });
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setRegLoading(true);
    try {
      const res = await register(regData);
      setRegSuccess(res.message);
      // reset form
      setRegData({
        full_name: '',
        employee_id: '',
        email: '',
        mobile: '',
        username: '',
        password: '',
        designation: 'Agent',
        team_id: 'team-alpha',
        process: 'Inbound Support',
        reporting_tl_id: 'usr-tl-1',
        date_of_joining: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      setRegError(err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-xs mb-3 border border-white/20 shadow-inner">
            <Shield className="w-8 h-8 text-blue-200" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Employee Performance &amp; Team Management</h1>
          <p className="text-xs text-blue-100 font-medium mt-1">
            Enterprise Role-Based Operational Performance &amp; Reporting System
          </p>

          {/* Tab Switcher */}
          <div className="flex bg-black/20 p-1 rounded-xl max-w-xs mx-auto mt-6 backdrop-blur-xs">
            <button
              onClick={() => {
                setMode('LOGIN');
                setLoginError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-blue-100 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('REGISTER');
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-blue-100 hover:text-white'
              }`}
            >
              Register New Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {mode === 'LOGIN' ? (
            <div>
              {loginError && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Access Denied:</span> {loginError}
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or rahul.sharma"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? 'Authenticating...' : 'Sign In to Portal'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* 1-Click Demo Profiles */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
                  Quick Demo Access (Pre-seeded Accounts)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('Admin@12345');
                    }}
                    className="p-2.5 border border-purple-200 bg-purple-50/70 hover:bg-purple-100 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-purple-900 block">Admin: Sarah Jenkins</span>
                    <span className="text-[10px] text-purple-700 font-mono">admin / Admin@12345</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUsername('vikram.malhotra');
                      setPassword('AM@12345');
                    }}
                    className="p-2.5 border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-indigo-900 block">AM: Vikram Malhotra</span>
                    <span className="text-[10px] text-indigo-700 font-mono">vikram.malhotra / AM@12345</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUsername('amit.verma');
                      setPassword('TL@12345');
                    }}
                    className="p-2.5 border border-teal-200 bg-teal-50/70 hover:bg-teal-100 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-teal-900 block">TL: Amit Verma</span>
                    <span className="text-[10px] text-teal-700 font-mono">amit.verma / TL@12345</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUsername('rahul.sharma');
                      setPassword('Agent@12345');
                    }}
                    className="p-2.5 border border-blue-200 bg-blue-50/70 hover:bg-blue-100 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-blue-900 block">Agent: Rahul Sharma</span>
                    <span className="text-[10px] text-blue-700 font-mono">rahul.sharma / Agent@12345</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {regError && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Registration Error:</span> {regError}
                  </div>
                </div>
              )}

              {regSuccess && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <span className="font-bold">Application Received:</span> {regSuccess}
                  </div>
                </div>
              )}

              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Policy:</strong> Accounts registered as Admin or Team Leader will automatically remain in <strong>Pending Approval</strong> state until verified and authorized by an existing Administrator.
                </span>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={regData.full_name}
                      onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SNB1090"
                      value={regData.employee_id}
                      onChange={(e) => setRegData({ ...regData, employee_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@performanceteam.corp"
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="+1-555-0999"
                      value={regData.mobile}
                      onChange={(e) => setRegData({ ...regData, mobile: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="vikram.malhotra"
                      value={regData.username}
                      onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation *</label>
                    <select
                      value={regData.designation}
                      onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Agent">Agent</option>
                      <option value="Team Leader">Team Leader (Requires Admin Approval)</option>
                      <option value="Assistant Manager">Assistant Manager (Requires Admin Approval)</option>
                      <option value="Admin">Admin (Requires Admin Approval)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Team</label>
                    <select
                      value={regData.team_id}
                      onChange={(e) => setRegData({ ...regData, team_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="team-alpha">Team Alpha (Inbound Support)</option>
                      <option value="team-beta">Team Beta (Tech Escalations)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Process / Department</label>
                    <input
                      type="text"
                      value={regData.process}
                      onChange={(e) => setRegData({ ...regData, process: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Joining</label>
                    <input
                      type="date"
                      value={regData.date_of_joining}
                      onChange={(e) => setRegData({ ...regData, date_of_joining: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                >
                  {regLoading ? 'Registering Account...' : 'Submit Registration Application'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Reset Account Password</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered official email address to receive password reset instructions.
            </p>

            {forgotMsg && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
                {forgotMsg}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                placeholder="name@performanceteam.corp"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMsg(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!forgotEmail) return;
                  setForgotMsg(`A secure recovery link has been sent to ${forgotEmail}. Please check your inbox.`);
                }}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
