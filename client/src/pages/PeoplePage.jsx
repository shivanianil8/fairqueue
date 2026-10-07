import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, ArrowUpDown, UserPlus, Trash2, RotateCcw } from 'lucide-react';
import { PriorityBadge, UrgencyBadge, AppointmentBadge, SpecialBadge } from '../components/Badges.jsx';

export default function PeoplePage({
  people = [],
  onOpenAddModal,
  onDeletePerson,
  onSeedDemo,
  onSelectPersonForProof,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nameAsc');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.personId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchUrgency = urgencyFilter === 'all' || (p.urgency || 'low').toLowerCase() === urgencyFilter;
      const matchAppt = appointmentFilter === 'all' || (p.appointmentStatus || 'walkin').toLowerCase() === appointmentFilter;

      return matchSearch && matchUrgency && matchAppt;
    }).sort((a, b) => {
      if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
      if (sortBy === 'waitTimeDesc') return (b.waitingTime || 0) - (a.waitingTime || 0);
      if (sortBy === 'idAsc') return a.personId.localeCompare(b.personId);
      return 0;
    });
  }, [people, searchTerm, urgencyFilter, appointmentFilter, sortBy]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await onDeletePerson(deleteTarget.personId);
      setDeleteTarget(null);
    } catch (err) {
      alert(`Error deleting: ${err.message}`);
    }
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">People Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered queue participants, arrival timestamps, and demographic attributes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Person</span>
          </button>

          <button
            onClick={onSeedDemo}
            className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
            title="Reload 12 demo service-centre cases"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Urgency */}
          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            className="py-1 px-2.5 rounded border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="all">All Urgencies</option>
            <option value="high">High Urgency</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Appointment */}
          <select
            value={appointmentFilter}
            onChange={e => setAppointmentFilter(e.target.value)}
            className="py-1 px-2.5 rounded border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="all">All Appointments</option>
            <option value="scheduled">Scheduled</option>
            <option value="walkin">Walk-in</option>
            <option value="missed">Missed</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2 text-slate-500">
          <span className="text-[11px] font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="py-1 px-2.5 rounded border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="nameAsc">Name (A-Z)</option>
            <option value="waitTimeDesc">Wait Time (Longest first)</option>
            <option value="idAsc">Person ID</option>
          </select>
        </div>
      </div>

      {/* Main Directory Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        {filteredPeople.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800">No people records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">NAME</th>
                  <th className="py-2.5 px-3">ARRIVAL</th>
                  <th className="py-2.5 px-3">WAIT TIME</th>
                  <th className="py-2.5 px-3">URGENCY</th>
                  <th className="py-2.5 px-3">APPOINTMENT</th>
                  <th className="py-2.5 px-3">SPECIAL REQUIREMENT</th>
                  <th className="py-2.5 px-3">CURRENT PRIORITY</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPeople.map((person) => (
                  <tr 
                    key={person.personId}
                    onClick={() => onSelectPersonForProof(person)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500 font-medium">
                      {person.personId}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-900 group-hover:text-blue-600 transition">
                      {person.name}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                      {person.arrivalTime || '09:00'}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700">
                      {person.waitingTime} min
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <UrgencyBadge urgency={person.urgency} />
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <AppointmentBadge status={person.appointmentStatus} />
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <SpecialBadge special={person.specialRequirement} />
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <PriorityBadge priority={person.priority} />
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectPersonForProof(person)}
                          className="px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Proof
                        </button>
                        <button
                          onClick={() => setDeleteTarget(person)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[1px]">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3 animate-fade-in text-xs">
            <h3 className="font-semibold text-slate-900">Remove Person</h3>
            <p className="text-slate-600">
              Permanently delete <strong className="text-slate-900">{deleteTarget.name}</strong> ({deleteTarget.personId})?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
