const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Persistent Bearer Token fallback (alongside HTTP-Only secure cookies)
let authToken = typeof window !== 'undefined' ? localStorage.getItem('fairqueue_token') : null;

export function setAuthToken(token) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('fairqueue_token', token);
    } else {
      localStorage.removeItem('fairqueue_token');
    }
  }
}

export function getAuthToken() {
  return authToken;
}

function getHeaders(customHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({ success: false, error: 'Non-JSON response received' }));
  if (!res.ok || data.success === false) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.code = data.code;
    err.details = data;
    throw err;
  }
  return data;
}

export const api = {
  // ---------------------------------------------------------------------------
  // AUTHENTICATION & USER SESSIONS
  // ---------------------------------------------------------------------------
  async register({ name, email, password, confirmPassword }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    const result = await handleResponse(res);
    if (result.token) setAuthToken(result.token);
    return result;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const result = await handleResponse(res);
    if (result.token) setAuthToken(result.token);
    return result;
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout network notice:', e);
    }
    setAuthToken(null);
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  async resetPassword({ token, password, confirmPassword }) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ token, password, confirmPassword }),
    });
    return handleResponse(res);
  },

  async updateProfile({ name, currentPassword, newPassword, confirmPassword }) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name, currentPassword, newPassword, confirmPassword }),
    });
    return handleResponse(res);
  },

  // ---------------------------------------------------------------------------
  // ORGANIZATIONS & TEAM COLLABORATION (MULTI-TENANCY)
  // ---------------------------------------------------------------------------
  async createOrganization({ name, type, description }) {
    const res = await fetch(`${API_BASE}/organizations`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name, type, description }),
    });
    return handleResponse(res);
  },

  async getCurrentOrganization() {
    const res = await fetch(`${API_BASE}/organizations/current`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async updateOrganization({ name, type, description, settings }) {
    const res = await fetch(`${API_BASE}/organizations/current`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name, type, description, settings }),
    });
    return handleResponse(res);
  },

  async getTeamMembers() {
    const res = await fetch(`${API_BASE}/organizations/current/members`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async inviteMember({ email, role }) {
    const res = await fetch(`${API_BASE}/organizations/current/invitations`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ email, role }),
    });
    return handleResponse(res);
  },

  async updateMemberRole(userId, role) {
    const res = await fetch(`${API_BASE}/organizations/current/members/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },

  async removeMember(userId) {
    const res = await fetch(`${API_BASE}/organizations/current/members/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // ---------------------------------------------------------------------------
  // QUEUES
  // ---------------------------------------------------------------------------
  async getQueues() {
    const res = await fetch(`${API_BASE}/queues`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async createQueue(queueData) {
    const res = await fetch(`${API_BASE}/queues`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(queueData),
    });
    return handleResponse(res);
  },

  async getQueue(queueId) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async deleteQueue(queueId) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // ---------------------------------------------------------------------------
  // QUEUE ENTRIES & LIVE OPERATIONS
  // ---------------------------------------------------------------------------
  async getQueueEntries(queueId, status = null) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}/entries${query}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async createQueueEntry(queueId, entryData) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}/entries`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(entryData),
    });
    return handleResponse(res);
  },

  async callNext(queueId) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}/entries/call-next`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async updateEntryStatus(queueId, entryId, status) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}/entries/${encodeURIComponent(entryId)}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async overrideEntry(queueId, entryId, newPriority, overrideReason) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}/entries/${encodeURIComponent(entryId)}/override`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ newPriority, overrideReason }),
    });
    return handleResponse(res);
  },

  async deleteQueueEntry(queueId, entryId) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}/entries/${encodeURIComponent(entryId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async seedSampleData(queueId) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}/entries/seed-sample`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async clearQueue(queueId) {
    const res = await fetch(`${API_BASE}/queues/${encodeURIComponent(queueId)}/entries/clear`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // ---------------------------------------------------------------------------
  // AUDIT TRAIL
  // ---------------------------------------------------------------------------
  async getAuditLogs(params = {}) {
    const q = new URLSearchParams();
    if (params.queueId) q.append('queueId', params.queueId);
    if (params.eventType) q.append('eventType', params.eventType);
    if (params.search) q.append('search', params.search);

    const res = await fetch(`${API_BASE}/audit?${q.toString()}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async exportAuditLogsUrl() {
    return `${API_BASE}/audit/export`;
  },

  // ---------------------------------------------------------------------------
  // OPERATIONAL REPORTS & FAIRNESS METRICS
  // ---------------------------------------------------------------------------
  async getOperationalReport(queueId = null, timeRange = 'today') {
    const q = new URLSearchParams();
    if (queueId) q.append('queueId', queueId);
    if (timeRange) q.append('timeRange', timeRange);

    const res = await fetch(`${API_BASE}/reports?${q.toString()}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // ---------------------------------------------------------------------------
  // PROLOG REASONING & ANALYSIS
  // ---------------------------------------------------------------------------
  async analyzeQueue(queueId = null) {
    const query = queueId ? `?queueId=${encodeURIComponent(queueId)}` : '';
    const res = await fetch(`${API_BASE}/analyze${query}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async comparePair(personIdA, personIdB) {
    const res = await fetch(`${API_BASE}/analyze/compare`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ personIdA, personIdB }),
    });
    return handleResponse(res);
  },

  async getRules() {
    const res = await fetch(`${API_BASE}/rules`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async updateThresholds(thresholds) {
    const res = await fetch(`${API_BASE}/rules/thresholds`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(thresholds),
    });
    return handleResponse(res);
  },

  async getAnalyses(queueId = null) {
    const query = queueId ? `?queueId=${encodeURIComponent(queueId)}` : '';
    const res = await fetch(`${API_BASE}/analyses${query}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getAnalysis(id) {
    const res = await fetch(`${API_BASE}/analyses/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getStatus() {
    const res = await fetch(`${API_BASE}/status`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },
};
