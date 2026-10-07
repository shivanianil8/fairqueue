import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { api } from '../services/api.js';

export default function OrganizationSettingsPage({ currentUser, activeOrganization, onOrgUpdated }) {
  const [name, setName] = useState(activeOrganization?.name || '');
  const [type, setType] = useState(activeOrganization?.type || 'Healthcare');
  const [description, setDescription] = useState(activeOrganization?.description || '');
  const [requireOverrideJustification, setRequireOverrideJustification] = useState(true);
  const [enforceAuditing, setEnforceAuditing] = useState(true);

  const [statusMessage, setStatusMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = currentUser?.role === 'ORGANIZATION_ADMIN';

  useEffect(() => {
    if (activeOrganization) {
      setName(activeOrganization.name || '');
      setType(activeOrganization.type || 'Healthcare');
      setDescription(activeOrganization.description || '');
      if (activeOrganization.settings) {
        setRequireOverrideJustification(Boolean(activeOrganization.settings.requireOverrideJustification));
        setEnforceAuditing(Boolean(activeOrganization.settings.enforceAuditing));
      }
    }
  }, [activeOrganization]);

  async function handleSave(e) {
    e.preventDefault();
    if (!isAdmin) return;
    setStatusMessage(null);

    setIsLoading(true);
    try {
      const res = await api.updateOrganization({
        name: name.trim(),
        type,
        description: description.trim(),
        settings: {
          requireOverrideJustification,
          enforceAuditing,
        },
      });

      setStatusMessage({ type: 'success', text: 'Organization settings updated successfully.' });
      if (onOrgUpdated && res.data) {
        onOrgUpdated(res.data);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update organization settings.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">Organization Profile & Governance</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Workspace parameters and policy enforcement rules for this facility
        </p>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-md text-xs flex items-center space-x-2 border ${
          statusMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {!isAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Organization settings can only be altered by an ORGANIZATION_ADMIN.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Facility Details</h3>

          <div>
            <label className="block text-xs font-medium text-slate-700">Organization Name</label>
            <div className="mt-1">
              <input
                type="text"
                disabled={!isAdmin}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Operational Domain / Sector</label>
            <div className="mt-1">
              <select
                disabled={!isAdmin}
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:border-slate-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
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
            <label className="block text-xs font-medium text-slate-700">Description</label>
            <div className="mt-1">
              <textarea
                rows={3}
                disabled={!isAdmin}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Governance Policies</h3>

          <div className="space-y-3">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={requireOverrideJustification}
                onChange={(e) => setRequireOverrideJustification(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
              <div>
                <span className="text-xs font-medium text-slate-800">Mandatory Justification for Priority Overrides</span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Require Queue Managers to submit a written clinical or operational reason whenever overriding Prolog priority.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={enforceAuditing}
                onChange={(e) => setEnforceAuditing(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
              <div>
                <span className="text-xs font-medium text-slate-800">Immutable Audit Logging</span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Record all ticket status changes, rule modifications, and inference runs into the audit trail.
                </p>
              </div>
            </label>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Saving...' : 'Save Organization Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
