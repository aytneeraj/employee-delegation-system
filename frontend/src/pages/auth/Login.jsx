import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.detail || 'Invalid email or password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectEmail = (demoEmail) => {
    setEmail(demoEmail);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-500/30 mb-3">
          ED
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Employee Task & Delegation System
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enterprise task delegation, peer hand-offs, and workflow review sign-off
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts for Local Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Prefill Demo Account
              </p>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                Password@123
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">
              Click a role below to load the email. The unified development password is <code className="text-indigo-600 font-semibold">Password@123</code> (configured via DEMO_ACCOUNT_PASSWORD in backend/.env).
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickSelectEmail('admin@company.com')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1.5 text-rose-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Role</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate group-hover:text-rose-600">admin@company.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectEmail('manager@company.com')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1.5 text-indigo-700 font-bold">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Manager Role</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate group-hover:text-indigo-600">manager@company.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectEmail('alex.dev@company.com')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Frontend Dev</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate group-hover:text-emerald-600">alex.dev@company.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectEmail('david.backend@company.com')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Backend Dev</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate group-hover:text-blue-600">david.backend@company.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

