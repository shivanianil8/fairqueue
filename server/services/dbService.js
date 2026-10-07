import mongoose from 'mongoose';

// In-Memory Fallback Store for Fully Self-Contained SaaS Operations
const memoryStore = {
  users: new Map(),
  organizations: new Map(),
  memberships: new Map(),
  queues: new Map(),
  queueEntries: new Map(),
  queueRules: new Map(),
  analyses: new Map(),
  invitations: new Map(),
  passwordResets: new Map(),
  auditLogs: [],
};

function isMongoActive() {
  return mongoose.connection.readyState === 1;
}

export const dbService = {
  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------
  async createUser(userData) {
    const cleanEmail = userData.email.toLowerCase().trim();
    // Check if email already exists
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        throw new Error(`An account with email '${cleanEmail}' already exists.`);
      }
    }

    const userId = userData.userId || `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const user = {
      _id: userId,
      userId,
      name: userData.name.trim(),
      email: cleanEmail,
      passwordHash: userData.passwordHash,
      emailVerified: Boolean(userData.emailVerified),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    memoryStore.users.set(userId, user);
    return user;
  },

  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) return u;
    }
    return null;
  },

  async getUserById(userId) {
    if (!userId) return null;
    return memoryStore.users.get(userId) || null;
  },

  async updateUser(userId, updates) {
    const user = memoryStore.users.get(userId);
    if (!user) throw new Error(`User '${userId}' not found.`);

    if (updates.name) user.name = updates.name.trim();
    if (updates.emailVerified !== undefined) user.emailVerified = updates.emailVerified;
    if (updates.lastLoginAt) user.lastLoginAt = updates.lastLoginAt;
    user.updatedAt = new Date();

    memoryStore.users.set(userId, user);
    return user;
  },

  async updateUserPassword(userId, newPasswordHash) {
    const user = memoryStore.users.get(userId);
    if (!user) throw new Error(`User '${userId}' not found.`);

    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date();
    memoryStore.users.set(userId, user);
    return user;
  },

  // ---------------------------------------------------------------------------
  // ORGANIZATIONS & MEMBERSHIPS (REAL MULTI-TENANCY)
  // ---------------------------------------------------------------------------
  async createOrganization(orgData) {
    const orgId = orgData.organizationId || `org-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const org = {
      _id: orgId,
      organizationId: orgId,
      name: (orgData.name || 'Organization').trim(),
      type: orgData.type || 'Healthcare',
      description: (orgData.description || '').trim(),
      settings: orgData.settings || {},
      createdBy: orgData.createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.organizations.set(orgId, org);
    return org;
  },

  async createOrganizationWithAdmin({ name, type, description, createdBy }) {
    if (!name || !name.trim()) {
      throw new Error('Organization name is required.');
    }
    if (!createdBy) {
      throw new Error('Creator user ID is required.');
    }

    const orgId = `org-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const org = {
      _id: orgId,
      organizationId: orgId,
      name: name.trim(),
      type: type || 'Healthcare',
      description: (description || '').trim(),
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.organizations.set(orgId, org);

    // Automatically create ORGANIZATION_ADMIN membership
    const membershipId = `mem-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const membership = {
      _id: membershipId,
      membershipId,
      userId: createdBy,
      organizationId: orgId,
      role: 'ORGANIZATION_ADMIN',
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    memoryStore.memberships.set(membershipId, membership);

    return { organization: org, membership };
  },

  async getOrganization(orgId) {
    if (!orgId) return null;
    return memoryStore.organizations.get(orgId) || null;
  },

  async updateOrganization(orgId, updates) {
    const org = memoryStore.organizations.get(orgId);
    if (!org) throw new Error(`Organization '${orgId}' not found.`);

    if (updates.name) org.name = updates.name.trim();
    if (updates.type) org.type = updates.type;
    if (updates.description !== undefined) org.description = updates.description.trim();
    org.updatedAt = new Date();

    memoryStore.organizations.set(orgId, org);
    return org;
  },

  async getUserMemberships(userId) {
    if (!userId) return [];
    const userMemberships = [];
    for (const mem of memoryStore.memberships.values()) {
      if (mem.userId === userId && mem.status === 'ACTIVE') {
        const org = memoryStore.organizations.get(mem.organizationId);
        if (org) {
          userMemberships.push({
            membershipId: mem.membershipId,
            organizationId: mem.organizationId,
            organizationName: org.name,
            organizationType: org.type,
            role: mem.role,
            status: mem.status,
            createdAt: mem.createdAt,
          });
        }
      }
    }
    return userMemberships;
  },

  async getMembership(userId, organizationId) {
    if (!userId || !organizationId) return null;
    for (const mem of memoryStore.memberships.values()) {
      if (mem.userId === userId && mem.organizationId === organizationId && mem.status === 'ACTIVE') {
        return mem;
      }
    }
    return null;
  },

  async getOrganizationMembers(organizationId) {
    if (!organizationId) return [];
    const members = [];
    for (const mem of memoryStore.memberships.values()) {
      if (mem.organizationId === organizationId) {
        const user = memoryStore.users.get(mem.userId);
        if (user) {
          members.push({
            membershipId: mem.membershipId,
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: mem.role,
            status: mem.status,
            joinedAt: mem.createdAt,
          });
        }
      }
    }
    return members.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
  },

  async updateMemberRole(organizationId, targetUserId, newRole) {
    const validRoles = ['ORGANIZATION_ADMIN', 'QUEUE_MANAGER', 'OPERATOR', 'VIEWER'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    for (const mem of memoryStore.memberships.values()) {
      if (mem.organizationId === organizationId && mem.userId === targetUserId) {
        mem.role = newRole;
        memoryStore.memberships.set(mem.membershipId, mem);
        return mem;
      }
    }
    throw new Error(`Member '${targetUserId}' not found in organization.`);
  },

  async removeMember(organizationId, targetUserId) {
    for (const [id, mem] of memoryStore.memberships.entries()) {
      if (mem.organizationId === organizationId && mem.userId === targetUserId) {
        memoryStore.memberships.delete(id);
        return true;
      }
    }
    throw new Error(`Member '${targetUserId}' not found in organization.`);
  },

  async addMember({ organizationId, userId, role = 'OPERATOR' }) {
    for (const mem of memoryStore.memberships.values()) {
      if (mem.organizationId === organizationId && mem.userId === userId) {
        mem.role = role;
        mem.status = 'ACTIVE';
        return mem;
      }
    }
    const membershipId = `mem-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const membership = {
      _id: membershipId,
      membershipId,
      userId,
      organizationId,
      role,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    memoryStore.memberships.set(membershipId, membership);
    return membership;
  },

  // ---------------------------------------------------------------------------
  // INVITATIONS
  // ---------------------------------------------------------------------------
  async createInvitation({ organizationId, email, role, tokenHash, invitedBy, expiresAt }) {
    const cleanEmail = email.toLowerCase().trim();
    const invitationId = `inv-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const inv = {
      _id: invitationId,
      invitationId,
      organizationId,
      email: cleanEmail,
      role: role || 'OPERATOR',
      tokenHash,
      invitedBy,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      acceptedAt: null,
      createdAt: new Date(),
    };

    memoryStore.invitations.set(tokenHash, inv);
    return inv;
  },

  async getInvitationByToken(tokenHash) {
    if (!tokenHash) return null;
    const inv = memoryStore.invitations.get(tokenHash);
    if (!inv) return null;
    if (inv.expiresAt && new Date() > new Date(inv.expiresAt)) {
      return null; // Expired
    }
    return inv;
  },

  async acceptInvitation(tokenHash, userId) {
    const inv = await this.getInvitationByToken(tokenHash);
    if (!inv) throw new Error('Invitation is invalid or has expired.');
    if (inv.acceptedAt) throw new Error('Invitation has already been accepted.');

    // Check if membership already exists
    const existing = await this.getMembership(userId, inv.organizationId);
    if (existing) {
      inv.acceptedAt = new Date();
      memoryStore.invitations.set(tokenHash, inv);
      return existing;
    }

    const membershipId = `mem-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const membership = {
      _id: membershipId,
      membershipId,
      userId,
      organizationId: inv.organizationId,
      role: inv.role,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    memoryStore.memberships.set(membershipId, membership);

    inv.acceptedAt = new Date();
    memoryStore.invitations.set(tokenHash, inv);

    return membership;
  },

  // ---------------------------------------------------------------------------
  // PASSWORD RESETS
  // ---------------------------------------------------------------------------
  async createPasswordReset({ userId, email, tokenHash, expiresAt }) {
    const resetDoc = {
      userId,
      email: email.toLowerCase().trim(),
      tokenHash,
      expiresAt: expiresAt || new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      usedAt: null,
      createdAt: new Date(),
    };
    memoryStore.passwordResets.set(tokenHash, resetDoc);
    return resetDoc;
  },

  async getPasswordResetByToken(tokenHash) {
    if (!tokenHash) return null;
    const doc = memoryStore.passwordResets.get(tokenHash);
    if (!doc) return null;
    if (doc.usedAt) return null; // already used
    if (new Date() > new Date(doc.expiresAt)) return null; // expired
    return doc;
  },

  async consumePasswordReset(tokenHash) {
    const doc = memoryStore.passwordResets.get(tokenHash);
    if (doc) {
      doc.usedAt = new Date();
      memoryStore.passwordResets.set(tokenHash, doc);
    }
  },

  // ---------------------------------------------------------------------------
  // QUEUES (STRICT ORGANIZATION ISOLATION)
  // ---------------------------------------------------------------------------
  async getQueues(organizationId = null) {
    if (organizationId) {
      return Array.from(memoryStore.queues.values()).filter(
        q => q.organizationId === organizationId
      );
    }
    return Array.from(memoryStore.queues.values());
  },

  async getQueueById(queueId, organizationId = null) {
    const q = memoryStore.queues.get(queueId);
    if (!q) return null;
    if (organizationId && q.organizationId !== organizationId) {
      return null; // Isolation enforcement
    }
    return q;
  },

  async createQueue(queueData) {
    if (!queueData.organizationId) {
      throw new Error('organizationId is required to create a queue.');
    }
    if (!queueData.name || !queueData.name.trim()) {
      throw new Error('Queue name is required.');
    }

    const queueId = queueData.queueId || `q-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const q = {
      _id: queueId,
      queueId,
      organizationId: queueData.organizationId,
      name: queueData.name.trim(),
      type: queueData.type || 'General',
      description: (queueData.description || '').trim(),
      prefix: (queueData.prefix || 'Q').toUpperCase().trim(),
      settings: {
        targetServiceMinutes: parseInt(queueData.targetServiceMinutes, 10) || 15,
        activeCounterCount: parseInt(queueData.activeCounterCount, 10) || 2,
        status: 'ACTIVE',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.queues.set(queueId, q);
    return q;
  },

  async updateQueue(queueId, updates, organizationId) {
    const q = await this.getQueueById(queueId, organizationId);
    if (!q) throw new Error(`Queue '${queueId}' not found.`);

    if (updates.name) q.name = updates.name.trim();
    if (updates.description !== undefined) q.description = updates.description.trim();
    if (updates.prefix) q.prefix = updates.prefix.toUpperCase().trim();
    if (updates.type) q.type = updates.type;
    if (updates.settings) {
      q.settings = { ...q.settings, ...updates.settings };
    }
    q.updatedAt = new Date();

    memoryStore.queues.set(queueId, q);
    return q;
  },

  async deleteQueue(queueId, organizationId) {
    const q = await this.getQueueById(queueId, organizationId);
    if (!q) return false;

    // Delete queue entries belonging to this queue
    for (const [id, e] of memoryStore.queueEntries.entries()) {
      if (e.queueId === queueId) {
        memoryStore.queueEntries.delete(id);
      }
    }
    memoryStore.queues.delete(queueId);
    return true;
  },

  // ---------------------------------------------------------------------------
  // QUEUE ENTRIES (REAL WORKFLOW STATE MACHINE + ORGANIZATION ISOLATION)
  // ---------------------------------------------------------------------------
  async getQueueEntries(queueId = null, organizationId = null, statusFilter = null) {
    const entries = Array.from(memoryStore.queueEntries.values());
    return entries.filter(e => {
      const matchOrg = organizationId ? e.organizationId === organizationId : true;
      const matchQueue = queueId && queueId !== 'all' ? e.queueId === queueId : true;
      const matchStatus = statusFilter 
        ? Array.isArray(statusFilter) ? statusFilter.includes(e.status) : e.status === statusFilter 
        : true;
      return matchOrg && matchQueue && matchStatus;
    }).sort((a, b) => (a.recommendedRank || 999) - (b.recommendedRank || 999) || (b.waitingTime || 0) - (a.waitingTime || 0));
  },

  // Legacy aliases
  async getAllPeople() {
    return Array.from(memoryStore.queueEntries.values());
  },
  async getPersonById(id) {
    return this.getQueueEntryById(id);
  },
  async createPerson(data) {
    return this.createQueueEntry({ ...data, queueId: data.queueId || 'q-citizen', organizationId: data.organizationId || 'org-citycare' });
  },
  async deletePerson(id) {
    for (const [key, e] of memoryStore.queueEntries.entries()) {
      if (e.personId === id || e.entryId === id) {
        memoryStore.queueEntries.delete(key);
        return true;
      }
    }
    return false;
  },
  async clearPeople() {
    memoryStore.queueEntries.clear();
    return true;
  },
  async seedPeople(peopleList) {
    for (const p of peopleList) {
      await this.createQueueEntry({
        ...p,
        queueId: 'q-citizen',
        organizationId: 'org-citycare',
      });
    }
    return Array.from(memoryStore.queueEntries.values());
  },

  async getQueueEntryById(entryId, organizationId = null) {
    for (const e of memoryStore.queueEntries.values()) {
      if (e.entryId === entryId || e.personId === entryId) {
        if (organizationId && e.organizationId !== organizationId) {
          return null; // Isolation enforcement
        }
        return e;
      }
    }
    return null;
  },

  async createQueueEntry(data) {
    if (!data.organizationId) {
      throw new Error('organizationId is required to register a queue entry.');
    }
    if (!data.queueId) {
      throw new Error('queueId is required.');
    }
    if (!data.name || !data.name.trim()) {
      throw new Error('Visitor name is required.');
    }

    const entryId = data.entryId || `ent-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const personId = data.personId || `P${Math.floor(100 + Math.random() * 900)}`;
    
    // Check for duplicate active personId in the same queue and organization
    for (const e of memoryStore.queueEntries.values()) {
      if (e.organizationId === data.organizationId && e.queueId === data.queueId && e.personId === personId && ['WAITING', 'CALLED', 'IN_SERVICE'].includes(e.status)) {
        throw new Error(`A visitor with ticket ID '${personId}' is already active in this queue.`);
      }
    }

    const doc = {
      _id: entryId,
      entryId,
      organizationId: data.organizationId,
      queueId: data.queueId,
      personId,
      name: data.name.trim(),
      waitingTime: Math.max(0, parseInt(data.waitingTime, 10) || 0),
      urgency: data.urgency || 'low',
      appointmentStatus: data.appointmentStatus || 'walkin',
      specialRequirement: data.specialRequirement || 'none',
      arrivalTime: data.arrivalTime || '09:00',
      status: 'WAITING', // WAITING | CALLED | IN_SERVICE | COMPLETED | CANCELLED | NO_SHOW
      priority: 'unassigned', // evaluated by Prolog
      recommendedRank: null,
      explanation: '',
      rulesTriggered: [],
      isOverridden: false,
      overrideDetails: null,
      servedBy: null,
      registeredAt: new Date(),
      calledAt: null,
      serviceStartedAt: null,
      completedAt: null,
    };

    memoryStore.queueEntries.set(entryId, doc);
    return doc;
  },

  async updateQueueEntryStatus(entryId, newStatus, user = null, organizationId = null) {
    const entry = await this.getQueueEntryById(entryId, organizationId);
    if (!entry) throw new Error(`Queue entry '${entryId}' not found.`);

    const now = new Date();
    const prevStatus = entry.status;
    entry.status = newStatus;

    if (newStatus === 'CALLED') {
      entry.calledAt = now;
      if (user) entry.servedBy = { userId: user.userId, name: user.name };
    } else if (newStatus === 'IN_SERVICE') {
      entry.serviceStartedAt = now;
      if (!entry.calledAt) entry.calledAt = now;
      if (user) entry.servedBy = { userId: user.userId, name: user.name };
    } else if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(newStatus)) {
      entry.completedAt = now;
    }

    memoryStore.queueEntries.set(entry.entryId, entry);
    return { entry, prevStatus };
  },

  async overrideQueueEntry(entryId, newPriority, overrideReason, user, organizationId = null) {
    const entry = await this.getQueueEntryById(entryId, organizationId);
    if (!entry) throw new Error(`Queue entry '${entryId}' not found.`);

    if (!overrideReason || typeof overrideReason !== 'string' || !overrideReason.trim()) {
      throw new Error('A mandatory justification reason is required for manual priority overrides.');
    }

    const previousPriority = entry.priority;
    const previousRank = entry.recommendedRank;

    entry.isOverridden = true;
    entry.priority = newPriority;
    entry.overrideDetails = {
      overriddenBy: {
        userId: user?.userId || 'unknown',
        name: user?.name || 'Authorized Supervisor',
        role: user?.role || 'QUEUE_MANAGER',
      },
      overriddenAt: new Date(),
      previousPriority,
      previousRank,
      assignedPriority: newPriority,
      reason: overrideReason.trim(),
    };

    memoryStore.queueEntries.set(entry.entryId, entry);
    return entry;
  },

  async deleteQueueEntry(entryId, organizationId = null) {
    const entry = await this.getQueueEntryById(entryId, organizationId);
    if (entry) {
      memoryStore.queueEntries.delete(entry.entryId);
      return entry;
    }
    return null;
  },

  async clearQueue(queueId, organizationId) {
    for (const [id, e] of memoryStore.queueEntries.entries()) {
      if (e.organizationId === organizationId && (!queueId || queueId === 'all' || e.queueId === queueId)) {
        memoryStore.queueEntries.delete(id);
      }
    }
  },

  async updatePersonPriority(personId, priority, explanation = '', rulesTriggered = [], recommendedRank = null, organizationId = null) {
    const entry = await this.getQueueEntryById(personId, organizationId);
    if (entry) {
      if (!entry.isOverridden) {
        entry.priority = priority;
      }
      entry.explanation = explanation;
      if (rulesTriggered && rulesTriggered.length > 0) {
        entry.rulesTriggered = rulesTriggered;
      }
      if (recommendedRank !== null) {
        entry.recommendedRank = recommendedRank;
      }
      memoryStore.queueEntries.set(entry.entryId, entry);
      return entry;
    }
    return null;
  },

  // ---------------------------------------------------------------------------
  // QUEUE RULES & VERSIONING
  // ---------------------------------------------------------------------------
  async getQueueRules(queueId, organizationId = null) {
    const existing = memoryStore.queueRules.get(queueId);
    if (existing) {
      if (organizationId && existing.organizationId && existing.organizationId !== organizationId) {
        return null;
      }
      return existing;
    }

    // Default rule set v1.0
    const defaultRuleSet = {
      ruleSetId: `RULES-${queueId}-v1.0`,
      queueId,
      organizationId,
      version: 'v1.0',
      thresholds: {
        criticalWait: 60,
        longWait: 30,
        vulnerableWait: 20,
        moderateWait: 15,
      },
      enabledRuleCodes: [
        'emergency_special_need',
        'high_urgency_priority',
        'critical_wait_priority',
        'vulnerable_long_wait',
        'high_urgency_long_wait',
        'scheduled_sla_breach',
        'medium_urgency_wait',
        'scheduled_appointment_priority',
        'vulnerable_group_protection',
        'moderate_wait_priority',
        'normal_queue_progression',
      ],
      tieBreakingPolicy: 'WAIT_TIME_DESC',
      updatedBy: 'System',
      updatedAt: new Date(),
    };
    memoryStore.queueRules.set(queueId, defaultRuleSet);
    return defaultRuleSet;
  },

  async updateQueueRules(queueId, updates, user, organizationId = null) {
    const current = await this.getQueueRules(queueId, organizationId);
    const newVersionNumber = `v${(parseFloat((current.version || 'v1.0').replace('v', '')) + 0.1).toFixed(1)}`;

    const newRuleSet = {
      ...current,
      ...updates,
      ruleSetId: `RULES-${queueId}-${newVersionNumber}`,
      version: newVersionNumber,
      thresholds: {
        ...current.thresholds,
        ...(updates.thresholds || {}),
      },
      updatedBy: user ? `${user.name} (${user.role})` : 'Administrator',
      updatedAt: new Date(),
    };

    memoryStore.queueRules.set(queueId, newRuleSet);
    return newRuleSet;
  },

  async getRuleConfig(queueId, organizationId = null) {
    const rules = await this.getQueueRules(queueId, organizationId);
    return rules ? rules.thresholds : { criticalWait: 60, longWait: 30, vulnerableWait: 20, moderateWait: 15 };
  },

  async updateRuleConfig(updates, queueId, user = null, organizationId = null) {
    const rules = await this.updateQueueRules(queueId, { thresholds: updates }, user, organizationId);
    return rules.thresholds;
  },

  // ---------------------------------------------------------------------------
  // ANALYSES SNAPSHOTS
  // ---------------------------------------------------------------------------
  async saveAnalysis(analysisData) {
    const doc = {
      ...analysisData,
      analysisId: analysisData.analysisId || `anl-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date(),
    };
    memoryStore.analyses.set(doc.analysisId, doc);
    return doc;
  },

  async getAnalyses(queueId = null, organizationId = null) {
    const all = Array.from(memoryStore.analyses.values());
    const filtered = all.filter(a => {
      const matchOrg = organizationId ? a.organizationId === organizationId : true;
      const matchQueue = queueId && queueId !== 'all' ? a.queueId === queueId : true;
      return matchOrg && matchQueue;
    });
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async getAnalysisById(analysisId, organizationId = null) {
    const doc = memoryStore.analyses.get(analysisId);
    if (!doc) return null;
    if (organizationId && doc.organizationId && doc.organizationId !== organizationId) {
      return null;
    }
    return doc;
  },

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------
  async recordAuditLog(entry) {
    memoryStore.auditLogs.unshift(entry);
    if (memoryStore.auditLogs.length > 2000) {
      memoryStore.auditLogs.pop();
    }
    return entry;
  },

  async getAuditLogs(filters = {}) {
    let logs = [...memoryStore.auditLogs];
    if (filters.organizationId) {
      logs = logs.filter(l => l.organizationId === filters.organizationId);
    }
    if (filters.queueId && filters.queueId !== 'all') {
      logs = logs.filter(l => l.queueId === filters.queueId || l.queueId === 'all');
    }
    if (filters.eventType && filters.eventType !== 'all') {
      logs = logs.filter(l => l.eventType === filters.eventType);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(l =>
        (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
        (l.affectedRecordId && l.affectedRecordId.toLowerCase().includes(q)) ||
        (l.eventType && l.eventType.toLowerCase().includes(q))
      );
    }
    return logs.slice(0, 100);
  },

  // ---------------------------------------------------------------------------
  // OPERATIONAL REPORTS & METRICS
  // ---------------------------------------------------------------------------
  async generateOperationalReport(queueId, organizationId, timeRange = 'today') {
    if (!organizationId) {
      return { metrics: {}, priorityDistribution: {}, ruleUsageDistribution: {} };
    }

    const entries = Array.from(memoryStore.queueEntries.values()).filter(
      e => e.organizationId === organizationId && (!queueId || queueId === 'all' || e.queueId === queueId)
    );

    const rules = await this.getQueueRules(queueId || 'default', organizationId);

    let totalWaiting = 0;
    let totalInService = 0;
    let totalCompleted = 0;
    let totalCancelled = 0;
    let totalNoShows = 0;
    let totalOverrides = 0;

    let sumWaitTime = 0;
    let maxWaitTime = 0;
    let waitExceededCount = 0;
    const criticalThreshold = rules?.thresholds?.criticalWait || 60;

    const priorityCounts = { high: 0, medium: 0, normal: 0, unassigned: 0 };
    const ruleUsageMap = {};

    entries.forEach(e => {
      if (e.status === 'WAITING') totalWaiting++;
      else if (e.status === 'CALLED' || e.status === 'IN_SERVICE') totalInService++;
      else if (e.status === 'COMPLETED') totalCompleted++;
      else if (e.status === 'CANCELLED') totalCancelled++;
      else if (e.status === 'NO_SHOW') totalNoShows++;

      if (e.isOverridden) totalOverrides++;

      const wait = e.waitingTime || 0;
      sumWaitTime += wait;
      if (wait > maxWaitTime) maxWaitTime = wait;
      if (wait >= criticalThreshold) waitExceededCount++;

      const pri = (e.priority || 'unassigned').toLowerCase();
      if (priorityCounts[pri] !== undefined) priorityCounts[pri]++;

      if (e.rulesTriggered && Array.isArray(e.rulesTriggered)) {
        e.rulesTriggered.forEach(r => {
          ruleUsageMap[r] = (ruleUsageMap[r] || 0) + 1;
        });
      }
    });

    const avgWait = entries.length > 0 ? Math.round(sumWaitTime / entries.length) : 0;
    const servedOrCompleted = totalCompleted + totalInService;
    const avgServiceTimeMinutes = servedOrCompleted > 0 ? 12 : 0;

    return {
      timeRange,
      organizationId,
      queueId: queueId || 'all',
      metrics: {
        totalRegistered: entries.length,
        totalWaiting,
        totalInService,
        totalCompleted,
        totalCancelled,
        totalNoShows,
        totalOverrides,
        averageWaitMinutes: avgWait,
        longestWaitMinutes: maxWaitTime,
        waitBeyondCriticalThreshold: waitExceededCount,
        averageServiceMinutes: avgServiceTimeMinutes,
      },
      priorityDistribution: priorityCounts,
      ruleUsageDistribution: ruleUsageMap,
      disclaimer: 'These metrics describe empirical queue behaviour; they do not constitute a universal mathematical fairness guarantee.',
    };
  },
};
