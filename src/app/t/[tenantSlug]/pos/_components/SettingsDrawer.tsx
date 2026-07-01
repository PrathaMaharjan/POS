"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/t/[tenantSlug]/pos/context/ThemeContext';
import { X, Mail, Lock, Eye, EyeOff, Check, Pencil, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [email, setEmail] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.email) {
            setEmail(u.email);
            setEmailDraft(u.email);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  const accent = isDark ? '#e5b83b' : '#16a34a';

  const bg = isDark ? '#0c0c0d' : '#ffffff';
  const surface = isDark ? '#141416' : '#f0fdf4';
  const border = isDark ? '#27272a' : '#bbf7d0';
  const textPrim = isDark ? '#ffffff' : '#14532d';
  const textMuted = isDark ? '#71717a' : '#4b7a58';
  const inputBg = isDark ? '#0c0c0d' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#86efac';

  const handleEditToggle = () => {
    if (!isEditingProfile) {
      setEmailDraft(email);
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setSaveError('');
      setSaveSuccess(false);
    }
    setIsEditingProfile(!isEditingProfile);
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    if (!emailDraft.includes('@')) {
      setSaveError('Please enter a valid email address.');
      return;
    }

    const wantsPasswordChange = !!password;
    if (wantsPasswordChange) {
      if (password.length < 8) {
        setSaveError('New password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setSaveError('Passwords do not match.');
        return;
      }
      if (!currentPassword) {
        setSaveError('Please enter your current password to change password.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: Record<string, string> = {
        email: emailDraft,
      };
      if (wantsPasswordChange) {
        payload.currentPassword = currentPassword;
        payload.newPassword = password;
      }

      const res = await api.patch('/auth/change-userDetail', payload);

      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setEmail(res.data.user.email || emailDraft);
      }

      setSaveSuccess(true);
      setIsEditingProfile(false);
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.response?.data?.error ?? 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        style={{ backgroundColor: bg, borderColor: border }}
        className={`absolute top-0 right-0 h-full w-full max-w-md border-l shadow-2xl flex flex-col pointer-events-auto transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div style={{ borderColor: border }} className="p-6 flex items-center justify-between border-b">
          <h2 style={{ color: textPrim }} className="text-3xl font-bold tracking-tight">Settings</h2>
          <button onClick={onClose} style={{ color: textMuted }} className="p-2 rounded-xl hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Account Profile */}
          <div className="space-y-3">
            <h3 style={{ color: textMuted }} className="text-xs font-bold uppercase tracking-widest">Account Profile</h3>
            <div style={{ backgroundColor: surface, borderColor: border }} className="border rounded-xl p-4 space-y-4">

              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: textPrim }} className="text-sm font-semibold">Active Operator</p>

                </div>
                <button
                  onClick={handleEditToggle}
                  style={{ color: textMuted }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-70 transition-opacity"
                >
                  {isEditingProfile ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  {isEditingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <Check className="w-3.5 h-3.5" /> Profile updated successfully.
                </div>
              )}

              {isEditingProfile ? (
                <div className="space-y-3 pt-1">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label style={{ color: textMuted }} className="text-xs font-medium flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Email
                    </label>
                    <input
                      type="email"
                      disabled={isSaving}
                      value={emailDraft}
                      onChange={e => setEmailDraft(e.target.value)}
                      style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrim }}
                      className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none transition-all placeholder-neutral-400 disabled:opacity-50"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label style={{ color: textMuted }} className="text-xs font-medium flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        disabled={isSaving}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrim }}
                        className="w-full text-sm px-3 py-2 pr-10 rounded-lg border focus:outline-none transition-all placeholder-neutral-400 disabled:opacity-50"
                        placeholder="Required only to change password"
                      />
                      <button type="button" disabled={isSaving} onClick={() => setShowCurrentPassword(p => !p)} style={{ color: textMuted }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label style={{ color: textMuted }} className="text-xs font-medium flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={isSaving}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrim }}
                        className="w-full text-sm px-3 py-2 pr-10 rounded-lg border focus:outline-none transition-all placeholder-neutral-400 disabled:opacity-50"
                        placeholder="Leave blank to keep current"
                      />
                      <button type="button" disabled={isSaving} onClick={() => setShowPassword(p => !p)} style={{ color: textMuted }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label style={{ color: textMuted }} className="text-xs font-medium flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        disabled={isSaving}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrim }}
                        className="w-full text-sm px-3 py-2 pr-10 rounded-lg border focus:outline-none transition-all placeholder-neutral-400 disabled:opacity-50"
                        placeholder="Re-enter new password"
                      />
                      <button type="button" disabled={isSaving} onClick={() => setShowConfirmPassword(p => !p)} style={{ color: textMuted }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {saveError && <p className="text-xs text-red-500">{saveError}</p>}

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ backgroundColor: accent }}
                    className="w-full mt-1 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs px-0.5" style={{ color: textMuted }}>
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{email || '—'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="space-y-3">
            <h3 style={{ color: textMuted }} className="text-xs font-bold uppercase tracking-widest">Theme</h3>
            <div style={{ backgroundColor: surface, borderColor: border }} className="border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p style={{ color: textPrim }} className="text-sm font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                <p style={{ color: textMuted }} className="text-xs mt-0.5">Switch between dark and light views</p>
              </div>

              <button
                onClick={toggleTheme}
                type="button"
                role="switch"
                aria-checked={isDark}
                style={{ backgroundColor: isDark ? '#e5b83b' : '#16a34a' }}
                className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              >
                <span
                  className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${isDark ? 'translate-x-5' : 'translate-x-0'}`}
                >
                  {isDark ? (
                    <svg className="w-3 h-3" style={{ color: '#e5b83b' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" style={{ color: '#16a34a' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>

        </div>


      </div>
    </div>
  );
}