import React, { useState } from 'react';
import { X, UserPlus, Wand2 } from 'lucide-react';

export default function AddPersonModal({ isOpen, onClose, onAddPerson }) {
  const [formData, setFormData] = useState({
    personId: `P${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    waitingTime: 25,
    urgency: 'medium',
    appointmentStatus: 'scheduled',
    specialRequirement: 'none',
    arrivalTime: new Date().toTimeString().slice(0, 5),
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Realistic Presets
  const presets = [
    {
      label: 'Emergency Trauma',
      data: { name: 'Dr. Suresh Kumar', urgency: 'high', waitingTime: 10, appointmentStatus: 'walkin', specialRequirement: 'emergency' }
    },
    {
      label: 'Elderly Prolonged Wait',
      data: { name: 'Kausalya Ammal', urgency: 'low', waitingTime: 65, appointmentStatus: 'scheduled', specialRequirement: 'elderly' }
    },
    {
      label: 'Scheduled SLA Breach',
      data: { name: 'Rajesh Varma', urgency: 'high', waitingTime: 40, appointmentStatus: 'scheduled', specialRequirement: 'disability' }
    },
    {
      label: 'Routine Walk-in',
      data: { name: 'Aditi Nair', urgency: 'low', waitingTime: 8, appointmentStatus: 'walkin', specialRequirement: 'none' }
    },
  ];

  function applyPreset(p) {
    setFormData(prev => ({
      ...prev,
      ...p.data,
      personId: `P${Math.floor(100 + Math.random() * 900)}`,
      arrivalTime: new Date().toTimeString().slice(0, 5),
    }));
  }

  function validate() {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.personId.trim()) errs.personId = 'Person ID is required';
    if (formData.waitingTime === '' || isNaN(formData.waitingTime) || Number(formData.waitingTime) < 0) {
      errs.waitingTime = 'Valid waiting time in minutes required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onAddPerson({
        ...formData,
        waitingTime: Number(formData.waitingTime),
      });
      onClose();
    } catch (err) {
      alert(`Error adding person: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-10 animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Add Person to Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Input visitor facts to assert into the Prolog knowledge base.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center space-x-2 text-xs overflow-x-auto scrollbar-none">
          <span className="text-slate-400 font-medium whitespace-nowrap text-[11px]">Presets:</span>
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 hover:border-slate-400 text-slate-700 whitespace-nowrap transition"
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* SECTION 1: PERSON INFORMATION */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Person Information
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anjana AS"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:ring-1 ${
                    errors.name ? 'border-rose-400 focus:ring-rose-300' : 'border-slate-300 focus:ring-slate-500'
                  }`}
                />
                {errors.name && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.name}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Person ID</label>
                <input
                  type="text"
                  value={formData.personId}
                  onChange={e => setFormData({ ...formData, personId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: QUEUE INFORMATION */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Queue Information
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={formData.arrivalTime}
                  onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Waiting Time (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.waitingTime}
                  onChange={e => setFormData({ ...formData, waitingTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
                {errors.waitingTime && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.waitingTime}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Urgency Level</label>
                <select
                  value={formData.urgency}
                  onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="low">Low (Routine)</option>
                  <option value="medium">Medium (Moderate)</option>
                  <option value="high">High (Urgent / Acute)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Appointment Status</label>
                <select
                  value={formData.appointmentStatus}
                  onChange={e => setFormData({ ...formData, appointmentStatus: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="scheduled">Scheduled Slot</option>
                  <option value="walkin">Walk-in</option>
                  <option value="missed">Missed Slot</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDITIONAL CONSIDERATIONS */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Additional Considerations
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Special Requirement</label>
              <select
                value={formData.specialRequirement}
                onChange={e => setFormData({ ...formData, specialRequirement: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="none">None (Standard visitor)</option>
                <option value="elderly">Elderly (Senior citizen)</option>
                <option value="disability">Disability (Mobility / assistance)</option>
                <option value="emergency">Emergency (Acute condition)</option>
                <option value="other">Other special circumstance</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 transition text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
