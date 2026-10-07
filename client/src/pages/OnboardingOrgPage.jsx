import React, { useState } from 'react';
import { Building2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';
import { navigate } from '../services/router.js';

export default function OnboardingOrgPage({ onOrgCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Healthcare');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide an organization name.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.createOrganization({
        name: name.trim(),
        type,
        description: description.trim(),
      });

      if (onOrgCreated) {
        onOrgCreated(res.data);
      }

      // Next step: setup first queue
      navigate('/onboarding/queue');
    } catch (err) {
      setError(err.message || 'Failed to create organization.');
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
          <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-semibold text-[10px]">Step 1 of 2</span>
          <span>Organization Setup</span>
        </div>

        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Create your organization
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Set up an isolated workspace for your queues and governance policies
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
              <label className="block text-xs font-medium text-slate-700">Organization / Facility Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Springfield General Hospital"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Sector / Operational Type</label>
              <div className="mt-1">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="Healthcare">Healthcare & Clinical Services</option>
                  <option value="Government">Government & Civic Administration</option>
                  <option value="Education">University & Academic Administration</option>
                  <option value="Banking">Banking & Financial Services</option>
                  <option value="CustomerService">Enterprise Customer Support</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Description (Optional)</label>
              <div className="mt-1">
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of department or services provided..."
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-slate-700 mt-0.5 flex-shrink-0" />
              <span>
                As creator, you will automatically be designated as <strong>Organization Administrator</strong> (ORGANIZATION_ADMIN) with full governance permissions.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition"
              >
                {isLoading ? <span>Creating organization...</span> : (
                  <>
                    <span>Continue to Queue Setup</span>
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
