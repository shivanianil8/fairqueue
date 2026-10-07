import React, { useState } from 'react';
import { ListOrdered, ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api.js';
import { navigate } from '../services/router.js';

export default function OnboardingQueuePage({ onQueueCreated }) {
  const [name, setName] = useState('General Admissions & Triage');
  const [prefix, setPrefix] = useState('GA');
  const [department, setDepartment] = useState('Central Admissions');
  const [targetServiceMinutes, setTargetServiceMinutes] = useState(10);
  const [description, setDescription] = useState('Primary visitor intake, priority assessment, and counter triage.');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a name for this queue.');
      return;
    }
    if (!prefix.trim()) {
      setError('Please provide a ticket prefix (e.g. GA, CS, TRI).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.createQueue({
        name: name.trim(),
        prefix: prefix.trim().toUpperCase(),
        department: department.trim(),
        targetServiceMinutes: Number(targetServiceMinutes) || 10,
        description: description.trim(),
      });

      if (onQueueCreated) {
        onQueueCreated(res.data);
      }

      // Finish onboarding -> go to main dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create queue desk.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
            FQ
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">FAIRQUEUE</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-semibold text-[10px]">Step 2 of 2</span>
          <span>Create Primary Queue</span>
        </div>

        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Set up your first queue desk
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Configure ticket prefixes, service targets, and Prolog rule defaults
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
              <label className="block text-xs font-medium text-slate-700">Queue Desk Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Citizen Enquiries & Triage"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Ticket Prefix</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="GA"
                    className="block w-full font-mono uppercase rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Target Service (Min)</label>
                <div className="mt-1">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={targetServiceMinutes}
                    onChange={(e) => setTargetServiceMinutes(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Department / Division</label>
              <div className="mt-1">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Operations & Reception"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Description</label>
              <div className="mt-1">
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Primary services handled by this counter..."
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
                {isLoading ? <span>Initializing desk...</span> : (
                  <>
                    <span>Complete Setup & Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
