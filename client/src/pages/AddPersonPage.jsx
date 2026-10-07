import React, { useState } from 'react';
import { 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Calendar, 
  Activity, 
  Wand2, 
  ArrowRight 
} from 'lucide-react';

export default function AddPersonPage({ onAddPerson, onNavigate }) {
  const [formData, setFormData] = useState({
    personId: `P${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    waitingTime: 15,
    urgency: 'medium',
    appointmentStatus: 'scheduled',
    specialRequirement: 'none',
    arrivalTime: new Date().toTimeString().slice(0, 5),
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1-Click Realistic Presets for Quick Testing
  const presets = [
    {
      title: 'Emergency Trauma Patient',
      desc: 'High urgency, emergency special need, 10 min wait',
      data: {
        name: 'Mateo Silva',
        waitingTime: 10,
        urgency: 'high',
        appointmentStatus: 'walkin',
        specialRequirement: 'emergency',
      },
    },
    {
      title: 'Prolonged Wait Elderly Patient',
      desc: 'Low urgency, but 65 min wait triggers critical starvation prevention rule',
      data: {
        name: 'Margaret Chen',
        waitingTime: 65,
        urgency: 'low',
        appointmentStatus: 'scheduled',
        specialRequirement: 'elderly',
      },
    },
    {
      title: 'Scheduled Patient SLA Breach',
      desc: 'Scheduled appointment holder waiting 40 min past committed slot',
      data: {
        name: 'Arjun Singhal',
        waitingTime: 40,
        urgency: 'high',
        appointmentStatus: 'scheduled',
        specialRequirement: 'disability',
      },
    },
    {
      title: 'Routine Walk-in',
      desc: 'Low urgency, 5 min wait, standard FIFO queue progression',
      data: {
        name: 'Lucas Wright',
        waitingTime: 5,
        urgency: 'low',
        appointmentStatus: 'walkin',
        specialRequirement: 'none',
      },
    },
  ];

  function applyPreset(preset) {
    setFormData(prev => ({
      ...prev,
      ...preset.data,
      personId: `P${Math.floor(100 + Math.random() * 900)}`,
      arrivalTime: new Date().toTimeString().slice(0, 5),
    }));
    setSuccessMessage(`Preset "${preset.title}" populated into form.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  }

  function validate() {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Person name is required.';
    }
    if (!formData.personId.trim()) {
      errs.personId = 'Person ID is required.';
    }
    if (formData.waitingTime === '' || isNaN(formData.waitingTime) || Number(formData.waitingTime) < 0) {
      errs.waitingTime = 'Waiting time must be a non-negative number of minutes.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onAddPerson({
        ...formData,
        waitingTime: Number(formData.waitingTime),
      });

      setSuccessMessage(`Person "${formData.name}" successfully added to the queue!`);
      // Reset form
      setFormData({
        personId: `P${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        waitingTime: 15,
        urgency: 'medium',
        appointmentStatus: 'scheduled',
        specialRequirement: 'none',
        arrivalTime: new Date().toTimeString().slice(0, 5),
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add person.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <span>Add Person to Queue</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Input individual facts to be asserted into the Prolog knowledge base (<code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-blue-600">person/7</code>).
        </p>
      </div>

      {/* Preset Quick Fill Cards */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm mb-3">
          <Wand2 className="w-4 h-4 text-blue-600" />
          <span>Quick Testing Presets (Rule Demonstrators)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-left p-3 rounded-xl bg-white border border-blue-200/70 hover:border-blue-400 hover:shadow-sm transition group"
            >
              <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 flex items-center justify-between">
                <span>{p.title}</span>
                <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Fill</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 leading-normal">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => onNavigate('analyze')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center space-x-1"
            >
              <span>Analyze Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Person Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Person Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Anjana Devi"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-blue-200 focus:border-blue-500'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
            </div>

            {/* Person ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Person ID <span className="text-rose-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g., P101"
                  value={formData.personId}
                  onChange={e => setFormData({ ...formData, personId: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                    errors.personId ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, personId: `P${Math.floor(100 + Math.random() * 900)}` })}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Gen
                </button>
              </div>
              {errors.personId && <p className="text-xs text-rose-600 mt-1">{errors.personId}</p>}
            </div>

            {/* Waiting Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Waiting Time (Minutes) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g., 25"
                  value={formData.waitingTime}
                  onChange={e => setFormData({ ...formData, waitingTime: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.waitingTime ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">mins</span>
              </div>
              {errors.waitingTime && <p className="text-xs text-rose-600 mt-1">{errors.waitingTime}</p>}
              <p className="text-[11px] text-slate-400 mt-1">Configured thresholds: 15m (mod), 30m (long), 60m (crit).</p>
            </div>

            {/* Arrival Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Arrival Time (HH:MM)
              </label>
              <input
                type="time"
                value={formData.arrivalTime}
                onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Acts as secondary tie-breaker in fair ordering.</p>
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Urgency Level
              </label>
              <select
                value={formData.urgency}
                onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
              >
                <option value="low">Low (Routine)</option>
                <option value="medium">Medium (Moderate urgency)</option>
                <option value="high">High (Acute / Urgent condition)</option>
              </select>
            </div>

            {/* Appointment Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Appointment Status
              </label>
              <select
                value={formData.appointmentStatus}
                onChange={e => setFormData({ ...formData, appointmentStatus: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
              >
                <option value="scheduled">Scheduled (Pre-booked Slot)</option>
                <option value="walkin">Walk-in (Unbooked)</option>
                <option value="missed">Missed Slot (Rescheduled)</option>
              </select>
            </div>

            {/* Special Requirement */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Special Requirement / Vulnerable Category
              </label>
              <select
                value={formData.specialRequirement}
                onChange={e => setFormData({ ...formData, specialRequirement: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
              >
                <option value="none">None (Standard visitor)</option>
                <option value="elderly">Elderly (Senior citizen accommodation)</option>
                <option value="disability">Disability (Accessibility / mobility assistance)</option>
                <option value="emergency">Emergency (Acute medical/operational distress)</option>
                <option value="other">Other special circumstance</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Triggers specific fairness protections: <code className="text-slate-600 font-mono">vulnerable_group_protection</code> or <code className="text-slate-600 font-mono">emergency_special_need</code>.
              </p>
            </div>
          </div>

          {/* Fact Preview */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono">
            <span className="text-slate-500">% Prolog Fact to be asserted:</span>
            <div className="text-emerald-400 font-semibold mt-1">
              person('{formData.personId || 'P???'}', '{formData.name || 'Name'}', {formData.waitingTime || 0}, {formData.urgency}, {formData.appointmentStatus}, {formData.specialRequirement}, '{formData.arrivalTime}').
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('queue')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Asserting Fact...' : 'Add Person to Queue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
