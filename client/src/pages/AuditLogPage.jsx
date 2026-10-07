import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  User,
  Clock
} from 'lucide-react';
import { api } from '../services/api.js';

export default function AuditLogPage({ selectedQueueId = 'all' }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter, selectedQueueId]);

  async function fetchLogs() {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        queueId: selectedQueueId === 'all' ? undefined : selectedQueueId,
        eventType: eventTypeFilter === 'all' ? undefined : eventTypeFilter,
        search: searchTerm || undefined,
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchLogs();
  }

  function getBadgeClass(type) {
    if (type.includes('OVERRIDE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (type.includes('LOGIN') || type.includes('SWITCH')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (type.includes('CALLED') || type.includes('STATUS')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (type.includes('RULE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail & Governance</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              IMMUTABLE LOG
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Traceable operational event ledger, manual override justifications, and logic policy changes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLogs}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <a
            href="/api/audit/export"
            download
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Trail (JSON)</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by user email, ticket ID, event type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Event:</span>
          </div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="all">All Events ({logs.length})</option>
            <option value="MANUAL_OVERRIDE_RECORDED">Manual Overrides</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="ENTRY_CALLED">Visitor Calls</option>
            <option value="QUEUE_STATUS_CHANGED">Status Changes</option>
            <option value="ENTRY_REGISTERED">Registrations</option>
            <option value="RULE_SET_ACTIVATED">Rule Set Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Actor / User</th>
                <th className="py-2.5 px-4">Affected Record</th>
                <th className="py-2.5 px-4">Operational Summary / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-slate-300" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.logId;
                  const dateStr = new Date(log.timestamp).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <React.Fragment key={log.logId}>
                      <tr 
                        onClick={() => setExpandedLogId(isExpanded ? null : log.logId)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition ${
                          isExpanded ? 'bg-slate-50/60' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getBadgeClass(log.eventType)}`}>
                            {log.eventType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-900">{log.userEmail}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">
                          {log.affectedRecordId || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                          {log.details?.reason ? (
                            <span className="font-medium text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Override: {log.details.reason}
                            </span>
                          ) : log.details?.message ? (
                            log.details.message
                          ) : (
                            JSON.stringify(log.details)
                          )}
                        </td>
                      </tr>

                      {/* Expandable JSON Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={6} className="px-10 py-3 border-b border-slate-200">
                            <div className="p-3 bg-white rounded border border-slate-200 space-y-2 font-mono text-[11px]">
                              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                                <span>Log ID: {log.logId}</span>
                                <span>Client IP: {log.ipAddress}</span>
                              </div>
                              <div className="text-slate-800">
                                <span className="font-semibold font-sans text-slate-700">Raw Audit Event Payload:</span>
                                <pre className="mt-1 p-2 bg-slate-900 text-slate-100 rounded overflow-x-auto text-[10px] leading-relaxed">
                                  {JSON.stringify(log, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
