import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Trash2, 
  Sparkles, 
  UserPlus, 
  RotateCcw, 
  AlertTriangle,
  PhoneCall,
  CheckCircle,
  PlayCircle,
  XCircle,
  UserX,
  ShieldAlert,
  ArrowRight,
  Clock
} from 'lucide-react';
import { PriorityBadge, UrgencyBadge, AppointmentBadge, SpecialBadge, PositionIndicator } from '../components/Badges.jsx';
import ManualOverrideModal from '../components/ManualOverrideModal.jsx';

export default function QueuePage({
  people = [],
  latestAnalysis,
  onDeletePerson,
  onClearQueue,
  onSeedDemo,
  onAnalyze,
  onOpenAddModal,
  onSelectPersonForProof,
  isAnalyzing,
  onCallNext,
  onUpdateStatus,
  onOverridePriority,
  currentUser,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('WAITING');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('position');

  // Confirmation & Override Modals State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [isCallingNext, setIsCallingNext] = useState(false);

  // Ranked queue from latest Prolog analysis
  const rankedQueue = latestAnalysis?.rankedQueue || [];

  const processedList = useMemo(() => {
    // If analysis exists, keep the deductive ordering
    const base = rankedQueue.length > 0
      ? rankedQueue.map((item, idx) => {
          const match = people.find(p => p.personId === item.personId || p.entryId === item.entryId);
          return {
            ...item,
            ...match,
            priority: match?.isOverridden ? match.priority : item.priority,
            recommendedRank: idx + 1,
          };
        })
      : [...people];

    // Also include any new people not in the historical snapshot
    people.forEach(p => {
      if (!base.find(b => b.personId === p.personId)) {
        base.push(p);
      }
    });

    return base.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.personId.toLowerCase().includes(searchTerm.toLowerCase());

      const personStatus = p.status || 'WAITING';
      const matchStatus = statusFilter === 'all' || personStatus === statusFilter;
      const matchPriority = priorityFilter === 'all' || (p.priority || 'unassigned').toLowerCase() === priorityFilter;
      const matchUrgency = urgencyFilter === 'all' || (p.urgency || 'low').toLowerCase() === urgencyFilter;

      return matchSearch && matchStatus && matchPriority && matchUrgency;
    }).sort((a, b) => {
      if (sortBy === 'waitingTimeDesc') return (b.waitingTime || 0) - (a.waitingTime || 0);
      if (sortBy === 'waitingTimeAsc') return (a.waitingTime || 0) - (b.waitingTime || 0);
      if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
      if (sortBy === 'arrivalAsc') return (a.arrivalTime || '').localeCompare(b.arrivalTime || '');
      return (a.recommendedRank || 999) - (b.recommendedRank || 999);
    });
  }, [people, rankedQueue, searchTerm, statusFilter, priorityFilter, urgencyFilter, sortBy]);

  const waitingCount = people.filter(p => (p.status || 'WAITING') === 'WAITING').length;
  const calledCount = people.filter(p => p.status === 'CALLED').length;
  const inServiceCount = people.filter(p => p.status === 'IN_SERVICE').length;
  const completedCount = people.filter(p => p.status === 'COMPLETED').length;

  // Identify top recommended next waiting person
  const topWaitingPerson = useMemo(() => {
    const waiting = people.filter(p => (p.status || 'WAITING') === 'WAITING');
    if (waiting.length === 0) return null;
    const rankedWaiting = waiting.filter(p => typeof p.recommendedRank === 'number').sort((a, b) => a.recommendedRank - b.recommendedRank);
    return rankedWaiting.length > 0 ? rankedWaiting[0] : waiting[0];
  }, [people]);

  async function handleCallNextClick() {
    if (!onCallNext) return;
    setIsCallingNext(true);
    try {
      await onCallNext();
    } catch (err) {
      alert(`Notice: ${err.message}`);
    } finally {
      setIsCallingNext(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await onDeletePerson(deleteTarget.entryId || deleteTarget.personId);
      setDeleteTarget(null);
    } catch (err) {
      alert(`Error deleting person: ${err.message}`);
    }
  }

  async function handleConfirmClear() {
    try {
      await onClearQueue();
      setShowClearConfirm(false);
    } catch (err) {
      alert(`Error clearing queue: ${err.message}`);
    }
  }

  function renderStatusBadge(status = 'WAITING') {
    switch (status) {
      case 'CALLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PhoneCall className="w-3 h-3 text-blue-600 animate-pulse" />
            <span>CALLED</span>
          </span>
        );
      case 'IN_SERVICE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlayCircle className="w-3 h-3 text-emerald-600" />
            <span>IN SERVICE</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle className="w-3 h-3 text-slate-500" />
            <span>COMPLETED</span>
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <UserX className="w-3 h-3 text-rose-600" />
            <span>NO SHOW</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-400" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>WAITING</span>
          </span>
        );
    }
  }

  const canOverride = ['ADMIN', 'QUEUE_MANAGER'].includes(currentUser?.role || 'QUEUE_MANAGER');
  const isViewer = currentUser?.role === 'VIEWER';

  return (
    <div className="space-y-4">
      {/* Header & Main Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Queue Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active service queue entries, Prolog-deduced priorities, and human-in-the-loop transition controls.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Call Next Button (Human Action vs Recommendation) */}
          <button
            onClick={handleCallNextClick}
            disabled={isCallingNext || waitingCount === 0 || isViewer}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-2xs disabled:opacity-50"
            title={waitingCount === 0 ? 'No waiting visitors in queue' : 'Call top recommended person to desk'}
          >
            <PhoneCall className={`w-3.5 h-3.5 ${isCallingNext ? 'animate-spin' : ''}`} />
            <span>Call Next Person</span>
          </button>

          {/* Deduce Priority via Prolog */}
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || people.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-2xs disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-blue-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Run Prolog Reasoning</span>
          </button>

          <button
            onClick={onOpenAddModal}
            disabled={isViewer}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-2xs disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Visitor</span>
          </button>

          <button
            onClick={onSeedDemo}
            className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
            title="Reload 12 demo service-centre cases"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {people.length > 0 && !isViewer && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 rounded border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
              title="Clear entire queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recommended Next Operational Callout Banner */}
      {topWaitingPerson && (
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              01
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{topWaitingPerson.name}</span>
                <span className="text-slate-400 font-mono">({topWaitingPerson.personId})</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                  Recommended Next Turn
                </span>
                {topWaitingPerson.isOverridden && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    MANUALLY OVERRIDDEN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Waiting <span className="font-semibold">{topWaitingPerson.waitingTime}m</span> • Reason: {topWaitingPerson.explanation || 'Evaluated highest priority by Horn clause deduction.'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => onSelectPersonForProof(topWaitingPerson)}
              className="px-2.5 py-1 rounded border border-blue-300 bg-white hover:bg-blue-50 text-blue-800 font-medium text-xs transition"
            >
              Inspect Proof
            </button>
            <button
              onClick={handleCallNextClick}
              disabled={isCallingNext || isViewer}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs flex items-center space-x-1 disabled:opacity-50"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call to Counter</span>
            </button>
          </div>
        </div>
      )}

      {/* State Machine Tab Filter */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-1 text-xs">
        {[
          { id: 'WAITING', label: 'Waiting', count: waitingCount },
          { id: 'CALLED', label: 'Called', count: calledCount },
          { id: 'IN_SERVICE', label: 'In Service', count: inServiceCount },
          { id: 'COMPLETED', label: 'Completed', count: completedCount },
          { id: 'all', label: 'All Entries', count: people.length },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search by visitor name or ticket ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="py-1 px-2.5 rounded border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="normal">Normal Priority</option>
            <option value="unassigned">Unassigned</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            className="py-1 px-2.5 rounded border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="all">All Urgencies</option>
            <option value="high">High Urgency</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2 text-slate-500">
          <span className="text-[11px] font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="py-1 px-2.5 rounded border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="position">Recommended Order (Prolog)</option>
            <option value="waitingTimeDesc">Waiting Time (High → Low)</option>
            <option value="waitingTimeAsc">Waiting Time (Low → High)</option>
            <option value="arrivalAsc">Arrival Time (Earliest First)</option>
            <option value="nameAsc">Visitor Name (A → Z)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {people.length === 0 ? (
          <div className="py-16 px-6 text-center text-slate-500 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Queue is completely empty</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                No tickets are registered in this queue. Add your first real visitor or load sample test data to evaluate Prolog logic rules.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={onOpenAddModal}
                className="px-3.5 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition flex items-center space-x-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Visitor</span>
              </button>
              <button
                onClick={onSeedDemo}
                className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 transition"
              >
                <span>Seed Sample Dataset</span>
              </button>
            </div>
          </div>
        ) : processedList.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No visitors found in this queue state</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Change the status filter tab above or register a new visitor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-14">POS</th>
                  <th className="py-2.5 px-3">VISITOR</th>
                  <th className="py-2.5 px-3">ARRIVAL</th>
                  <th className="py-2.5 px-3">WAIT TIME</th>
                  <th className="py-2.5 px-3">URGENCY</th>
                  <th className="py-2.5 px-3">APPOINTMENT</th>
                  <th className="py-2.5 px-3">SPECIAL REQ</th>
                  <th className="py-2.5 px-3">DEDUCED PRIORITY</th>
                  <th className="py-2.5 px-3">WORKFLOW STATE</th>
                  <th className="py-2.5 px-3 text-right">WORKFLOW ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedList.map((person, idx) => {
                  const isTopWaiting = (person.status || 'WAITING') === 'WAITING' && (person.recommendedRank === 1 || idx === 0);
                  const entryId = person.entryId || person.personId;

                  return (
                    <tr 
                      key={person.personId} 
                      onClick={() => onSelectPersonForProof(person)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                        person.isOverridden ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <PositionIndicator position={person.recommendedRank || idx + 1} priority={person.priority} />
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                            {person.name}
                          </div>
                          {isTopWaiting && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              NEXT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
                          <span>{person.personId}</span>
                          {person.isOverridden && (
                            <span 
                              title={`Overridden by ${person.overrideDetails?.overriddenBy?.name || 'Manager'}: "${person.overrideDetails?.reason || ''}"`}
                              className="text-amber-700 bg-amber-100 px-1 py-0.2 rounded border border-amber-200 font-sans font-medium"
                            >
                              OVERRIDDEN
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                        {person.arrivalTime || '09:00'}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                        <span className={person.waitingTime >= 60 ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                          {person.waitingTime} min
                        </span>
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

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {renderStatusBadge(person.status)}
                      </td>

                      {/* State Machine Transition Actions */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Waiting -> Call */}
                          {(person.status || 'WAITING') === 'WAITING' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(entryId, 'CALLED')}
                                disabled={isViewer}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition shadow-2xs flex items-center space-x-1 disabled:opacity-50"
                                title="Call visitor to desk"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>Call</span>
                              </button>
                              {canOverride && (
                                <button
                                  onClick={() => setOverrideTarget(person)}
                                  className="px-2 py-1 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[11px] transition"
                                  title="Controlled priority override with audit log"
                                >
                                  <ShieldAlert className="w-3 h-3 inline mr-0.5" />
                                  <span>Override</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Called -> Start Service or No Show */}
                          {person.status === 'CALLED' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(entryId, 'IN_SERVICE')}
                                disabled={isViewer}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition shadow-2xs flex items-center space-x-1 disabled:opacity-50"
                              >
                                <PlayCircle className="w-3 h-3" />
                                <span>Serve</span>
                              </button>
                              <button
                                onClick={() => onUpdateStatus(entryId, 'NO_SHOW')}
                                disabled={isViewer}
                                className="px-1.5 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] transition disabled:opacity-50"
                                title="Mark as No Show"
                              >
                                No Show
                              </button>
                            </>
                          )}

                          {/* In Service -> Complete or Cancel */}
                          {person.status === 'IN_SERVICE' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(entryId, 'COMPLETED')}
                                disabled={isViewer}
                                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] transition shadow-2xs flex items-center space-x-1 disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Finish</span>
                              </button>
                              <button
                                onClick={() => onUpdateStatus(entryId, 'CANCELLED')}
                                disabled={isViewer}
                                className="px-1.5 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] transition disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => onSelectPersonForProof(person)}
                            className="px-2 py-1 rounded border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition"
                            title="Inspect Prolog first-order derivation"
                          >
                            Proof
                          </button>

                          {canOverride && (
                            <button
                              onClick={() => setDeleteTarget(person)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Remove visitor record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      {overrideTarget && (
        <ManualOverrideModal
          isOpen={Boolean(overrideTarget)}
          person={overrideTarget}
          currentUser={currentUser}
          onClose={() => setOverrideTarget(null)}
          onConfirmOverride={async (entryId, newPriority, reason) => {
            await onOverridePriority(entryId, newPriority, reason);
            setOverrideTarget(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[1px]">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3 animate-fade-in text-xs">
            <div className="flex items-center space-x-2 text-rose-600 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Removal</span>
            </div>
            <p className="text-slate-600 leading-normal">
              Remove <strong className="text-slate-900">{deleteTarget.name}</strong> ({deleteTarget.personId}) from the active queue?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-2xs transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Queue Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[1px]">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3 animate-fade-in text-xs">
            <div className="flex items-center space-x-2 text-rose-600 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Clear Entire Queue</span>
            </div>
            <p className="text-slate-600 leading-normal">
              Are you sure you want to remove all {people.length} active queue entries?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-2xs transition"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
