import React, { useState } from 'react';
import { ShieldAlert, AlertCircle, X, Check } from 'lucide-react';
import { PriorityBadge } from './Badges.jsx';

export default function ManualOverrideModal({
  isOpen,
  onClose,
  person,
  onConfirmOverride,
  currentUser,
}) {
  const [newPriority, setNewPriority] = useState('high');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !person) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory operational justification reason is required.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirmOverride(person.entryId || person.personId, newPriority, reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to apply manual override.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden text-slate-800 text-xs">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Manual Priority Override</h3>
              <p className="text-[11px] text-slate-500">Controlled supervisory override with mandatory audit trail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Person Info Box */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{person.name}</div>
              <div className="text-[11px] font-mono text-slate-500">Ticket ID: {person.personId} | Wait: {person.waitingTime}m</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Prolog Priority</div>
              <PriorityBadge priority={person.priority} />
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] flex items-start space-x-2 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Audited Action:</span> This override bypasses standard Prolog deductive ranking. Your user ID (<span className="font-mono font-medium">{currentUser?.email || 'manager@citycare.gov'}</span>) and the justification will be immutably recorded in the compliance log.
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
              {error}
            </div>
          )}

          {/* New Priority Selection */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Select Overridden Priority <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'high', label: 'High Priority', desc: 'Urgent attention' },
                { value: 'medium', label: 'Medium Priority', desc: 'Accelerated' },
                { value: 'normal', label: 'Normal Priority', desc: 'Standard flow' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setNewPriority(opt.value)}
                  className={`p-2 rounded border text-left transition ${
                    newPriority === opt.value
                      ? 'border-slate-800 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-[11px] capitalize">{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${newPriority === opt.value ? 'text-slate-300' : 'text-slate-400'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mandatory Justification */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Mandatory Justification Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Clinical nurse emergency triage escalation, severe mobility limitation, verified consular expedite order..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 bg-white"
            />
            <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
              <span>Required for quality and fairness audit compliance</span>
              <span>{reason.length} chars</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition shadow-2xs disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording...' : 'Authorize Override'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
