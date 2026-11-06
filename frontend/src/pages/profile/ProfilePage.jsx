import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { RoleBadge } from '../../components/common/Badge';
import {
  User,
  Mail,
  Shield,
  Building,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();

  // Profile Edit
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    try {
      setSavingProfile(true);
      setProfileMsg('');
      setProfileError('');
      await authService.updateProfile({ full_name: fullName.trim() });
      await refreshUser();
      setProfileMsg('Profile information updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters long.');
      return;
    }
    try {
      setSavingPwd(true);
      setPwdMsg('');
      setPwdError('');
      await authService.changePassword(currentPassword, newPassword);
      setPwdMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <User className="w-5 h-5 text-indigo-600" />
          <span>My Profile & Account Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your corporate employee details, update profile information, and manage credentials
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-indigo-600/20">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
              <p className="text-xs text-slate-500">{user?.designation}</p>
              <div className="flex items-center space-x-2 mt-2">
                <RoleBadge role={user?.role} />
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {user?.employee_id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Address</span>
            </span>
            <p className="font-semibold text-slate-800">{user?.email}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <Building className="w-3.5 h-3.5" />
              <span>Department</span>
            </span>
            <p className="font-semibold text-slate-800">{user?.department?.name || 'General Engineering'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <User className="w-3.5 h-3.5" />
              <span>Reporting Manager</span>
            </span>
            <p className="font-semibold text-slate-800">{user?.reporting_manager?.full_name || 'Senior Leadership'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joining Date</span>
            </span>
            <p className="font-semibold text-slate-800">{user?.joining_date || 'N/A'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Account Status</span>
            </span>
            <span className="inline-flex items-center text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Active Employee
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Edit Profile & Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Update Profile Form */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Update Profile Details</span>
          </h3>

          {profileMsg && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileMsg}</span>
            </div>
          )}
          {profileError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Corporate email cannot be changed without admin approval.</p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <span>Change Security Password</span>
          </h3>

          {pwdMsg && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pwdMsg}</span>
            </div>
          )}
          {pwdError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={savingPwd}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {savingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
