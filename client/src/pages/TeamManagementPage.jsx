import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, CheckCircle2, AlertCircle, X, Mail } from 'lucide-react';
import { api } from '../services/api.js';

export default function TeamManagementPage({ currentUser }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('OPERATOR');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const isAdmin = currentUser?.role === 'ORGANIZATION_ADMIN';

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.getTeamMembers();
      setMembers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load team members.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault();
    setError('');
    setInviteResult(null);

    if (!inviteEmail.trim() || !/^\S+@\S+\.\S+$/.test(inviteEmail.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsInviting(true);
    try {
      const res = await api.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteResult(res);
      setInviteEmail('');
      setSuccessMsg(`Invitation dispatched to ${res.invitation?.email || 'user'}.`);
      loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.updateMemberRole(userId, newRole);
      setSuccessMsg('Member authorization updated.');
      loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to update member role.');
    }
  }

  async function handleRemoveMember(userId, memberName) {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this organization?`)) {
      return;
    }

    try {
      await api.removeMember(userId);
      setSuccessMsg(`Removed ${memberName} from the organization.`);
      loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to remove member.');
    }
  }

  const roleDescriptions = {
    ORGANIZATION_ADMIN: 'Full administrative access to manage organization, billing, team, queues, and policies.',
    QUEUE_MANAGER: 'Manage queue policies, edit Prolog thresholds, and execute justified manual overrides.',
    OPERATOR: 'Counter operator access: call next ticket, mark in-service, and complete tickets.',
    VIEWER: 'Read-only access to view live queue state, analytics, and compliance audit trail.',
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">Team & Member Permissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC) governing queue operations and administrative authority
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setInviteResult(null);
              setIsInviteModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 transition flex items-center space-x-1.5 self-start sm:self-auto shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs font-semibold text-slate-800">
            Active Organization Members ({members.length})
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {isAdmin ? 'Full RBAC Authority' : 'Read-Only Member View'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-5 py-2.5">Member Name</th>
                <th className="px-5 py-2.5">Email</th>
                <th className="px-5 py-2.5">Role Authorization</th>
                <th className="px-5 py-2.5">Joined Date</th>
                {isAdmin && <th className="px-5 py-2.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-5 py-8 text-center text-slate-400">
                    Loading team members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-5 py-8 text-center text-slate-400">
                    No members found in this organization.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isSelf = member.userId === currentUser?.userId;
                  return (
                    <tr key={member.userId || member.membershipId} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3 font-medium text-slate-900 flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {member.name ? member.name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <span>{member.name}</span>
                        {isSelf && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                        {member.email}
                      </td>
                      <td className="px-5 py-3">
                        {isAdmin && !isSelf ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-medium focus:outline-none focus:border-slate-400"
                          >
                            <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN</option>
                            <option value="QUEUE_MANAGER">QUEUE_MANAGER</option>
                            <option value="OPERATOR">OPERATOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            member.role === 'ORGANIZATION_ADMIN'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : member.role === 'QUEUE_MANAGER'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : member.role === 'OPERATOR'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Active'}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleRemoveMember(member.userId, member.name)}
                              title="Remove member"
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Reference Grid */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">
          Role Authorization Matrix
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {Object.entries(roleDescriptions).map(([role, desc]) => (
            <div key={role} className="bg-white p-3 rounded border border-slate-200">
              <div className="font-mono font-semibold text-[11px] text-slate-900">{role}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-semibold text-slate-900">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteResult?.devInviteUrl ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs">
                  <div className="font-semibold">Invitation Generated!</div>
                  <div className="mt-1 text-[11px]">
                    Development Mode: Copy the link below to accept the invitation:
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-[10px] break-all text-slate-800">
                  {inviteResult.devInviteUrl}
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700">Team Member Email</label>
                  <div className="mt-1">
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@organization.gov"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700">Assigned Operational Role</label>
                  <div className="mt-1">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none focus:border-slate-500"
                    >
                      <option value="OPERATOR">OPERATOR - Counter Service Officer</option>
                      <option value="QUEUE_MANAGER">QUEUE_MANAGER - Policy & Overrides</option>
                      <option value="VIEWER">VIEWER - Read-Only Auditor</option>
                      <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN - Full Admin</option>
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {roleDescriptions[inviteRole]}
                  </p>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isInviting ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
