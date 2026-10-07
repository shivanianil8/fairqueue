import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { navigate } from '../services/router.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessInfo(res);
    } catch (err) {
      setError(err.message || 'Unable to process password reset request.');
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
          Reset your password
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Enter the email associated with your account
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

          {successInfo ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Reset Instructions Sent</div>
                  <div className="mt-0.5 text-emerald-700">{successInfo.message}</div>
                </div>
              </div>

              {/* Dev mode instant reset link */}
              {successInfo.devResetUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Development Mode Reset Link:
                  </div>
                  <a
                    href={successInfo.devResetUrl}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(successInfo.devResetUrl);
                    }}
                    className="block text-slate-900 font-mono text-[11px] underline break-all hover:text-slate-700"
                  >
                    {successInfo.devResetUrl}
                  </a>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2 px-4 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Account Email</label>
                <div className="mt-1">
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition"
                >
                  {isLoading ? <span>Processing...</span> : <span>Send Reset Instructions</span>}
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
