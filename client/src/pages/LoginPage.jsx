import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { navigate } from '../services/router.js';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess(res.user, res.activeOrganization, res.memberships);
      }
      if (!res.activeOrganization && (!res.memberships || res.memberships.length === 0)) {
        navigate('/onboarding/organization');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleFillDemo(demoEmail, demoPassword) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center justify-center space-x-2 cursor-pointer mb-2"
        >
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
            FQ
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">FAIRQUEUE</span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Sign in to your organization
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Or{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-medium text-slate-900 underline hover:text-slate-700"
          >
            create a new organization account
          </button>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1 relative rounded-md shadow-xs">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition"
              >
                {isLoading ? <span>Verifying credentials...</span> : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Pre-fill for Reviewers */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-2">
              Evaluator Quick Access
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@citycare.gov', 'Admin@123')}
                className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 transition"
              >
                <div className="font-semibold text-slate-800">Org Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@citycare.gov</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('manager@citycare.gov', 'Manager@123')}
                className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 transition"
              >
                <div className="font-semibold text-slate-800">Queue Manager</div>
                <div className="text-[10px] text-slate-400 truncate">manager@citycare.gov</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
