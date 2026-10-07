import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { navigate, getQueryParams } from '../services/router.js';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = getQueryParams();
    if (params.token) {
      setToken(params.token);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('A valid reset token is required.');
      return;
    }
    if (!password || password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword({
        token: token.trim(),
        password,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset failed. The token may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
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
          Set new password
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Enter your new credentials below
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

          {success ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Password Successfully Updated</div>
                  <div className="mt-0.5 text-emerald-700">
                    Your password has been changed. You can now sign in with your new credentials.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 bg-slate-900 text-white font-medium text-xs rounded-md hover:bg-slate-800 transition"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Reset Token</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter security token"
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">New Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Confirm New Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition"
                >
                  {isLoading ? <span>Updating password...</span> : <span>Save New Password</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
