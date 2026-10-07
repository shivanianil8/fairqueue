import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { navigate } from '../services/router.js';

export default function RegisterPage({ onLoginSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function validate() {
    if (!name.trim()) return 'Please enter your full name.';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (!password || password.length < 8) return 'Password must be at least 8 characters long.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (onLoginSuccess) {
        onLoginSuccess(res.user, null, []);
      }

      // Route directly to organization onboarding
      navigate('/onboarding/organization');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
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
          Create your FAIRQUEUE account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-slate-900 underline hover:text-slate-700"
          >
            Sign in
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
              <label className="block text-xs font-medium text-slate-700">Full Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Work Email Address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.smith@organization.org"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Password</label>
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
              <label className="block text-xs font-medium text-slate-700">Confirm Password</label>
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
                {isLoading ? <span>Creating account...</span> : (
                  <>
                    <span>Create Account & Setup Organization</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 text-[11px] text-slate-400 text-center">
            By signing up, you will become the Organization Administrator of your new workspace.
          </div>
        </div>
      </div>
    </div>
  );
}
