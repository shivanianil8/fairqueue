import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopHeader from './components/TopHeader.jsx';
import DecisionDrawer from './components/DecisionDrawer.jsx';
import AddPersonModal from './components/AddPersonModal.jsx';

import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import OnboardingOrgPage from './pages/OnboardingOrgPage.jsx';
import OnboardingQueuePage from './pages/OnboardingQueuePage.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import QueuePage from './pages/QueuePage.jsx';
import AnalyzePage from './pages/AnalyzePage.jsx';
import PeoplePage from './pages/PeoplePage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import RulesPage from './pages/RulesPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import StatusPage from './pages/StatusPage.jsx';
import VivaGuidePage from './pages/VivaGuidePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import TeamManagementPage from './pages/TeamManagementPage.jsx';
import OrganizationSettingsPage from './pages/OrganizationSettingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AccountSettingsPage from './pages/AccountSettingsPage.jsx';

import { api } from './services/api.js';
import { getCurrentPath, navigate, subscribeRouter } from './services/router.js';

export default function App() {
  const [currentPath, setCurrentPath] = useState(getCurrentPath());
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real Authenticated User & Multi-Tenant State
  const [currentUser, setCurrentUser] = useState(null);
  const [activeOrganization, setActiveOrganization] = useState(null);
  const [userMemberships, setUserMemberships] = useState([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Queues State for Active Organization
  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);

  // Application Operational Data State
  const [people, setPeople] = useState([]);
  const [rules, setRules] = useState([]);
  const [thresholds, setThresholds] = useState({});
  const [analyses, setAnalyses] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  // UI Interactive State
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPersonForProof, setSelectedPersonForProof] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Page titles and subtitles map
  const pageMeta = {
    dashboard: { title: 'Overview', subtitle: 'Real-time queue monitoring and operational fairness decisions' },
    queue: { title: 'Queue Management', subtitle: 'Live visitor service queue, Prolog deductive priorities, and state controls' },
    analyze: { title: 'Decision Support', subtitle: 'Prolog first-order logic engine evaluation and Horn clause resolution' },
    people: { title: 'Visitor Directory', subtitle: 'Registered visitors, arrival timestamps, and demographic attributes' },
    reports: { title: 'Operational Reports', subtitle: 'Queue throughput telemetry, wait duration metrics, and rule frequency' },
    audit: { title: 'Audit Trail & Governance', subtitle: 'Immutable operational event ledger, override justifications, and policy changes' },
    rules: { title: 'Rules & Logic', subtitle: 'Prolog Horn clause knowledge base and dynamic threshold configuration' },
    history: { title: 'Analysis History', subtitle: 'Audit log of historical queue analyses and decision snapshots' },
    status: { title: 'System Status', subtitle: 'Runtime telemetry for SWI-Prolog, database, and REST API' },
    viva: { title: 'Academic Viva Guide', subtitle: 'Logic programming paradigms and examiner questions' },
    settings: { title: 'Settings', subtitle: 'Operational preferences and queue cache management' },
    team: { title: 'Team & RBAC', subtitle: 'Manage organization team members, invitations, and role authorizations' },
    organization: { title: 'Organization Profile', subtitle: 'Workspace parameters and policy enforcement rules' },
    profile: { title: 'User Profile', subtitle: 'Personal identification and credentials management' },
    account: { title: 'Account & Security', subtitle: 'Active session details and authentication security' },
  };

  // 1. Subscribe to URL route changes
  useEffect(() => {
    return subscribeRouter((path) => {
      setCurrentPath(path);
      // Map specific path to internal tabs if inside dashboard
      if (path === '/profile') setActiveTab('profile');
      else if (path === '/settings/team') setActiveTab('team');
      else if (path === '/settings/organization') setActiveTab('organization');
      else if (path === '/settings/account') setActiveTab('account');
      else if (path === '/dashboard') setActiveTab('dashboard');
      else if (path === '/queue') setActiveTab('queue');
      else if (path === '/analyze') setActiveTab('analyze');
      else if (path === '/audit') setActiveTab('audit');
      else if (path === '/reports') setActiveTab('reports');
      else if (path === '/rules') setActiveTab('rules');
    });
  }, []);

  // 2. Check session and authentication on mount
  useEffect(() => {
    checkAuthAndLoadWorkspace();
  }, []);

  // 3. Reload queue entries when selectedQueueId changes
  useEffect(() => {
    async function loadEntries() {
      if (!selectedQueueId || !currentUser) return;
      try {
        const res = await api.getQueueEntries(selectedQueueId);
        const currentEntries = res.data || [];
        setPeople(currentEntries);

        // Fetch latest analysis snapshot for this queue
        const anlRes = await api.getAnalyses(selectedQueueId).catch(() => null);
        if (anlRes && anlRes.data && anlRes.data.length > 0) {
          setAnalyses(anlRes.data);
          setLatestAnalysis(anlRes.data[0]);
        } else if (currentEntries.length > 0) {
          // If queue has visitors but no analysis record yet, run Prolog immediately
          try {
            const freshAnl = await api.analyzeQueue(selectedQueueId);
            setLatestAnalysis(freshAnl);
            const refPeople = await api.getQueueEntries(selectedQueueId);
            setPeople(refPeople.data || []);
          } catch (e) {
            console.warn('Auto-analysis notice:', e.message);
          }
        }
      } catch (err) {
        console.warn('Queue entries loading notice:', err.message);
      }
    }
    loadEntries();
  }, [selectedQueueId]);

  async function checkAuthAndLoadWorkspace() {
    setIsAuthChecking(true);
    try {
      const userRes = await api.getCurrentUser().catch(() => null);
      if (userRes && userRes.success && userRes.user) {
        setCurrentUser(userRes.user);
        setActiveOrganization(userRes.activeOrganization || null);
        setUserMemberships(userRes.memberships || []);

        // Check if user has an active organization
        if (!userRes.activeOrganization && (!userRes.memberships || userRes.memberships.length === 0)) {
          if (currentPath !== '/onboarding/organization' && currentPath !== '/') {
            navigate('/onboarding/organization');
          }
        } else {
          // User is authenticated and belongs to an organization, load workspace data
          await loadWorkspaceData(userRes.activeOrganization?.organizationId);
        }
      } else {
        setCurrentUser(null);
        setActiveOrganization(null);
        // If on private route, redirect to login
        const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
        if (!publicRoutes.includes(currentPath)) {
          navigate('/login');
        }
      }
    } catch (err) {
      console.warn('Authentication verification notice:', err);
    } finally {
      setIsAuthChecking(false);
    }
  }

  async function loadWorkspaceData(orgId) {
    setIsLoading(true);
    try {
      const [statusRes, queuesRes, rulesRes, analysesRes] = await Promise.allSettled([
        api.getStatus(),
        api.getQueues(),
        api.getRules(),
        api.getAnalyses(),
      ]);

      if (statusRes.status === 'fulfilled') setSystemStatus(statusRes.value);
      
      let currentQueues = [];
      if (queuesRes.status === 'fulfilled') {
        currentQueues = queuesRes.value.data || [];
        setQueues(currentQueues);
      }

      if (rulesRes.status === 'fulfilled') {
        setRules(rulesRes.value.rules || []);
        setThresholds(rulesRes.value.thresholds || {});
      }

      if (analysesRes.status === 'fulfilled') {
        const hist = analysesRes.value.data || [];
        setAnalyses(hist);
        if (hist.length > 0) setLatestAnalysis(hist[0]);
      }

      // Handle queue selection
      if (currentQueues.length > 0) {
        const targetQ = selectedQueueId || currentQueues[0].queueId;
        setSelectedQueueId(targetQ);
        try {
          const peopleRes = await api.getQueueEntries(targetQ);
          setPeople(peopleRes.data || []);
        } catch (e) {
          console.warn('Queue entries fetch notice:', e);
        }
      } else {
        setSelectedQueueId(null);
        setPeople([]);
        // If organization has 0 queues and user is in app, send to queue onboarding
        if (currentPath !== '/onboarding/queue' && currentPath !== '/onboarding/organization') {
          navigate('/onboarding/queue');
        }
      }
    } catch (err) {
      console.error('Workspace data load error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Handle Login / Registration Success Callback
  function handleLoginSuccess(user, org, memberships) {
    setCurrentUser(user);
    setActiveOrganization(org);
    setUserMemberships(memberships || []);
    if (org) {
      loadWorkspaceData(org.organizationId);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setActiveOrganization(null);
    setUserMemberships([]);
    setQueues([]);
    setPeople([]);
  }

  // Action: Call Next Person to Counter
  async function handleCallNext() {
    if (!selectedQueueId) return;
    try {
      const res = await api.callNext(selectedQueueId);
      showToast(`Called Ticket ${res.data.personId} (${res.data.name}) to service counter.`);
      const pRes = await api.getQueueEntries(selectedQueueId);
      setPeople(pRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Action: Update Queue Entry Status
  async function handleUpdateStatus(entryId, newStatus) {
    if (!selectedQueueId) return;
    try {
      const res = await api.updateEntryStatus(selectedQueueId, entryId, newStatus);
      showToast(`Updated status to ${newStatus} for ticket ${res.data.personId}.`);
      const pRes = await api.getQueueEntries(selectedQueueId);
      setPeople(pRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Action: Controlled Manual Override
  async function handleOverridePriority(entryId, newPriority, reason) {
    if (!selectedQueueId) return;
    try {
      const res = await api.overrideEntry(selectedQueueId, entryId, newPriority, reason);
      showToast(`Manual priority override recorded for ${res.data.personId}.`);
      const pRes = await api.getQueueEntries(selectedQueueId);
      setPeople(pRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Action: Analyze Queue with Prolog
  async function handleAnalyze() {
    if (!selectedQueueId) {
      showToast('Please select or create a queue desk first.', 'error');
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeQueue(selectedQueueId);
      setLatestAnalysis(res);
      const pRes = await api.getQueueEntries(selectedQueueId);
      setPeople(pRes.data || []);
      const aRes = await api.getAnalyses(selectedQueueId);
      setAnalyses(aRes.data || []);
      showToast('Prolog Horn clause analysis completed. Priorities updated.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Action: Add Person to Queue
  async function handleAddPerson(personData) {
    if (!selectedQueueId) throw new Error('No active queue selected.');
    const res = await api.createQueueEntry(selectedQueueId, personData);
    const pRes = await api.getQueueEntries(selectedQueueId);
    setPeople(pRes.data || []);
    
    // Refresh latest analysis
    const aRes = await api.getAnalyses(selectedQueueId).catch(() => null);
    if (aRes && aRes.data && aRes.data.length > 0) {
      setAnalyses(aRes.data);
      setLatestAnalysis(aRes.data[0]);
    } else if (res.analysis) {
      setLatestAnalysis(res.analysis);
      setAnalyses([res.analysis]);
    }

    const priorityLabel = res.data?.priority ? ` [${res.data.priority.toUpperCase()}]` : '';
    showToast(`Registered ${personData.name}${priorityLabel} in queue.`);
    return res;
  }

  // Action: Delete Person
  async function handleDeletePerson(entryId) {
    if (!selectedQueueId) return;
    await api.deleteQueueEntry(selectedQueueId, entryId);
    const pRes = await api.getQueueEntries(selectedQueueId);
    setPeople(pRes.data || []);
    showToast('Visitor removed from queue.');
  }

  // Action: Clear Queue
  async function handleClearQueue() {
    if (!selectedQueueId) return;
    await api.clearQueue(selectedQueueId);
    setPeople([]);
    showToast('Active queue cleared.');
  }

  // Action: Seed Sample Data
  async function handleSeedDemo() {
    if (!selectedQueueId) return;
    setIsLoading(true);
    try {
      await api.seedSampleData(selectedQueueId);
      const pRes = await api.getQueueEntries(selectedQueueId);
      setPeople(pRes.data || []);
      showToast('Populated 12 realistic service-centre cases for logic evaluation.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Action: Update Thresholds
  async function handleUpdateThresholds(newThresholds) {
    const res = await api.updateThresholds(newThresholds);
    setThresholds(res.thresholds);
    showToast('Updated logic thresholds in Prolog knowledge base.');
    return res;
  }

  // Action: Compare Pair
  async function handleComparePair(idA, idB) {
    return await api.comparePair(idA, idB);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC & ONBOARDING ROUTE RENDERING
  // ---------------------------------------------------------------------------
  if (currentPath === '/') {
    return <LandingPage />;
  }

  if (currentPath === '/login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPath === '/register') {
    return <RegisterPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPath === '/forgot-password') {
    return <ForgotPasswordPage />;
  }

  if (currentPath === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (currentPath === '/onboarding/organization') {
    return (
      <OnboardingOrgPage
        onOrgCreated={(newOrg) => {
          setActiveOrganization(newOrg);
          checkAuthAndLoadWorkspace();
        }}
      />
    );
  }

  if (currentPath === '/onboarding/queue') {
    return (
      <OnboardingQueuePage
        onQueueCreated={(newQueue) => {
          setQueues([newQueue]);
          setSelectedQueueId(newQueue.queueId);
          checkAuthAndLoadWorkspace();
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED SAAS APPLICATION DASHBOARD
  // ---------------------------------------------------------------------------
  const currentMeta = pageMeta[activeTab] || { title: 'FAIRQUEUE', subtitle: 'Queue Management' };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-slate-900 font-sans antialiased text-xs">
      {/* 1. Left Fixed Sidebar (240px wide) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        currentUser={currentUser}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onGlobalSearch={setGlobalSearchTerm}
          activeTab={activeTab}
          queues={queues}
          selectedQueueId={selectedQueueId}
          onSelectQueue={setSelectedQueueId}
          currentUser={currentUser}
          activeOrganization={activeOrganization}
          onNavigateTab={setActiveTab}
          onLogout={handleLogout}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardPage
                people={people}
                latestAnalysis={latestAnalysis}
                onAnalyze={handleAnalyze}
                onNavigate={setActiveTab}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onSelectPersonForProof={setSelectedPersonForProof}
                isAnalyzing={isAnalyzing}
                systemStatus={systemStatus}
                onCallNext={handleCallNext}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'queue' && (
              <QueuePage
                people={people}
                latestAnalysis={latestAnalysis}
                onDeletePerson={handleDeletePerson}
                onClearQueue={handleClearQueue}
                onSeedDemo={handleSeedDemo}
                onAnalyze={handleAnalyze}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onSelectPersonForProof={setSelectedPersonForProof}
                isAnalyzing={isAnalyzing}
                onCallNext={handleCallNext}
                onUpdateStatus={handleUpdateStatus}
                onOverridePriority={handleOverridePriority}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'analyze' && (
              <AnalyzePage
                people={people}
                latestAnalysis={latestAnalysis}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                onSelectPersonForProof={setSelectedPersonForProof}
                systemStatus={systemStatus}
              />
            )}

            {activeTab === 'people' && (
              <PeoplePage
                people={people}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onDeletePerson={handleDeletePerson}
                onSeedDemo={handleSeedDemo}
                onSelectPersonForProof={setSelectedPersonForProof}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsPage selectedQueueId={selectedQueueId} />
            )}

            {activeTab === 'audit' && (
              <AuditLogPage selectedQueueId={selectedQueueId} />
            )}

            {activeTab === 'rules' && (
              <RulesPage
                rules={rules}
                thresholds={thresholds}
                onUpdateThresholds={handleUpdateThresholds}
              />
            )}

            {activeTab === 'history' && (
              <HistoryPage
                analyses={analyses}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'status' && (
              <StatusPage
                systemStatus={systemStatus}
                people={people}
                analyses={analyses}
              />
            )}

            {activeTab === 'viva' && (
              <VivaGuidePage />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                thresholds={thresholds}
                onUpdateThresholds={handleUpdateThresholds}
                onSeedDemo={handleSeedDemo}
                onClearQueue={handleClearQueue}
                peopleCount={people.length}
              />
            )}

            {activeTab === 'team' && (
              <TeamManagementPage currentUser={currentUser} />
            )}

            {activeTab === 'organization' && (
              <OrganizationSettingsPage
                currentUser={currentUser}
                activeOrganization={activeOrganization}
                onOrgUpdated={setActiveOrganization}
              />
            )}

            {activeTab === 'profile' && (
              <ProfilePage
                currentUser={currentUser}
                onProfileUpdated={(updatedUser) => setCurrentUser((prev) => ({ ...prev, ...updatedUser }))}
              />
            )}

            {activeTab === 'account' && (
              <AccountSettingsPage
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}
          </div>
        </main>
      </div>

      {/* 3. Decision Proof Explanation Slide-Over Drawer */}
      {selectedPersonForProof && (
        <DecisionDrawer
          person={selectedPersonForProof}
          allPeople={people}
          latestAnalysis={latestAnalysis}
          onClose={() => setSelectedPersonForProof(null)}
          onComparePair={handleComparePair}
        />
      )}

      {/* 4. Add Person Modal */}
      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPerson={handleAddPerson}
      />

      {/* 5. Minimal Enterprise Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded shadow-lg text-xs font-medium border flex items-center space-x-2 animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-900 text-white border-rose-800'
            : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
