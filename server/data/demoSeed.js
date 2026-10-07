import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { demoPeople } from './demoData.js';

export async function seedDemoEnvironment() {
  console.log('[Seed] Initializing CityCare Service Centre demo environment...');

  // 1. Organization
  const existingOrg = await dbService.getOrganization('org-citycare');
  if (!existingOrg) {
    await dbService.createOrganization({
      organizationId: 'org-citycare',
      name: 'CityCare Municipal & Health Services Centre',
      code: 'CITYCARE-01',
      type: 'MUNICIPAL_HEALTH',
      settings: {
        enforceAuditing: true,
        requireOverrideJustification: true,
        allowViewerExport: true,
        sessionTimeoutMinutes: 60,
      },
    });
    console.log('[Seed] Created Organization: CityCare Municipal & Health Services Centre');
  }

  // 2. Demo Queues
  const queues = [
    {
      queueId: 'q-citizen',
      organizationId: 'org-citycare',
      name: 'Citizen Services & Healthcare Desk',
      description: 'General citizen enquiries, healthcare registrations, and essential welfare services.',
      prefix: 'CS',
      department: 'Public Health & Welfare',
      targetServiceMinutes: 10,
      activeCounterCount: 4,
      status: 'ACTIVE',
    },
    {
      queueId: 'q-doc',
      organizationId: 'org-citycare',
      name: 'Document Verification & Licensing',
      description: 'Identity verification, civic certifications, residency documentation, and commercial permits.',
      prefix: 'DV',
      department: 'Civic Registry',
      targetServiceMinutes: 15,
      activeCounterCount: 2,
      status: 'ACTIVE',
    },
    {
      queueId: 'q-appt',
      organizationId: 'org-citycare',
      name: 'Specialist Appointments & Consular Desk',
      description: 'Pre-scheduled specialist consultations, legal affidavits, and consular public verifications.',
      prefix: 'SA',
      department: 'Specialized Consultations',
      targetServiceMinutes: 20,
      activeCounterCount: 2,
      status: 'ACTIVE',
    },
  ];

  for (const q of queues) {
    const existingQ = await dbService.getQueueById(q.queueId);
    if (!existingQ) {
      await dbService.createQueue(q);
      // Initialize default rules for each queue
      await dbService.getQueueRules(q.queueId);
    }
  }
  console.log('[Seed] Provisioned 3 production queues (Citizen Services, Document Verification, Appointments).');

  // 3. Demo Users with PBKDF2 Password Hashing
  const demoUsers = [
    {
      userId: 'usr-admin-01',
      organizationId: 'org-citycare',
      email: 'admin@citycare.gov',
      passwordHash: authService.hashPassword('Admin@123'),
      name: 'Dr. Robert Chen',
      role: 'ORGANIZATION_ADMIN',
      title: 'Chief Operations Administrator',
      department: 'Executive Operations',
    },
    {
      userId: 'usr-mgr-01',
      organizationId: 'org-citycare',
      email: 'manager@citycare.gov',
      passwordHash: authService.hashPassword('Manager@123'),
      name: 'Sarah Jenkins',
      role: 'QUEUE_MANAGER',
      title: 'Queue Operations & Policy Manager',
      department: 'Public Service Operations',
    },
    {
      userId: 'usr-op-01',
      organizationId: 'org-citycare',
      email: 'operator@citycare.gov',
      passwordHash: authService.hashPassword('Operator@123'),
      name: 'David Miller',
      role: 'OPERATOR',
      title: 'Senior Counter Officer (Counter 01)',
      department: 'Citizen Services',
    },
    {
      userId: 'usr-view-01',
      organizationId: 'org-citycare',
      email: 'viewer@citycare.gov',
      passwordHash: authService.hashPassword('Viewer@123'),
      name: 'Elena Rostova',
      role: 'VIEWER',
      title: 'Compliance & Audit Analyst',
      department: 'Quality & Governance',
    },
  ];

  for (const u of demoUsers) {
    const existingUser = await dbService.getUserByEmail(u.email);
    if (!existingUser) {
      await dbService.createUser(u);
    }
    await dbService.addMember({
      organizationId: 'org-citycare',
      userId: u.userId,
      role: u.role,
    });
  }
  console.log('[Seed] Provisioned 4 demo RBAC accounts and memberships: Organization Admin, Manager, Operator, Viewer.');

  // 4. Populate Queue Entries if empty
  const currentEntries = await dbService.getQueueEntries();
  if (currentEntries.length === 0) {
    // Distribute the 12 demo visitors
    for (let i = 0; i < demoPeople.length; i++) {
      const person = demoPeople[i];
      let queueId = 'q-citizen';
      if (i >= 8 && i < 10) queueId = 'q-doc';
      else if (i >= 10) queueId = 'q-appt';

      const entry = await dbService.createQueueEntry({
        queueId,
        organizationId: 'org-citycare',
        personId: person.personId,
        name: person.name,
        waitingTime: person.waitingTime,
        urgency: person.urgency,
        appointmentStatus: person.appointmentStatus,
        specialRequirement: person.specialRequirement,
        arrivalTime: person.arrivalTime,
      });

      // Assign realistic workflow states to simulate active operations
      if (person.personId === 'P007') {
        await dbService.updateQueueEntryStatus(entry.entryId, 'CALLED', {
          userId: 'usr-op-01',
          name: 'David Miller',
        });
      } else if (person.personId === 'P008') {
        await dbService.updateQueueEntryStatus(entry.entryId, 'IN_SERVICE', {
          userId: 'usr-op-01',
          name: 'David Miller',
        });
      } else if (person.personId === 'P009') {
        await dbService.updateQueueEntryStatus(entry.entryId, 'COMPLETED', {
          userId: 'usr-op-01',
          name: 'David Miller',
        });
      }
    }
    console.log('[Seed] Populated 12 realistic queue entries across 3 queues.');
  }

  // 5. Seed Demonstration Audit Logs if empty
  const currentLogs = await dbService.getAuditLogs();
  if (currentLogs.length === 0) {
    await dbService.recordAuditLog({
      logId: 'LOG-SYS-001',
      timestamp: new Date(Date.now() - 3600000 * 3),
      organizationId: 'org-citycare',
      queueId: 'all',
      userId: 'usr-admin-01',
      userEmail: 'admin@citycare.gov',
      userRole: 'ADMIN',
      eventType: 'SYSTEM_INITIALIZED',
      affectedRecordId: 'org-citycare',
      details: {
        message: 'CityCare Service Centre system initialized with ISO Tau-Prolog inference engine v1.0.',
        queuesConfigured: 3,
      },
      ipAddress: '127.0.0.1',
    });

    await dbService.recordAuditLog({
      logId: 'LOG-RULES-001',
      timestamp: new Date(Date.now() - 3600000 * 2),
      organizationId: 'org-citycare',
      queueId: 'q-citizen',
      userId: 'usr-mgr-01',
      userEmail: 'manager@citycare.gov',
      userRole: 'QUEUE_MANAGER',
      eventType: 'RULE_SET_ACTIVATED',
      affectedRecordId: 'RULES-q-citizen-v1.0',
      details: {
        version: 'v1.0',
        criticalWaitThreshold: 60,
        rulesCount: 11,
      },
      ipAddress: '127.0.0.1',
    });

    await dbService.recordAuditLog({
      logId: 'LOG-OVERRIDE-001',
      timestamp: new Date(Date.now() - 1800000),
      organizationId: 'org-citycare',
      queueId: 'q-citizen',
      userId: 'usr-mgr-01',
      userEmail: 'manager@citycare.gov',
      userRole: 'QUEUE_MANAGER',
      eventType: 'MANUAL_OVERRIDE_RECORDED',
      affectedRecordId: 'P006',
      details: {
        previousPriority: 'high',
        assignedPriority: 'high',
        reason: 'Immediate clinical nurse triage protocol: acute emergency triage presented at reception desk.',
        authorizedRole: 'QUEUE_MANAGER',
      },
      ipAddress: '127.0.0.1',
    });
    console.log('[Seed] Populated initial audit logs.');
  }

  console.log('[Seed] CityCare Service Centre demo environment successfully primed.');
}
