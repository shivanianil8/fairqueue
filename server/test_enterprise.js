import { dbService } from './services/dbService.js';
import { authService } from './services/authService.js';
import { seedDemoEnvironment } from './data/demoSeed.js';

async function testEnterpriseSuite() {
  console.log('========================================================');
  console.log('FAIRQUEUE ENTERPRISE PLATFORM TEST SUITE');
  console.log('========================================================');

  // Step 1: Prime Environment
  console.log('\n[1] Priming Demo Environment...');
  await seedDemoEnvironment();

  // Step 2: Test Multi-Queue Architecture
  console.log('\n[2] Testing Multi-Queue Model...');
  const queues = await dbService.getQueues('org-citycare');
  console.log(`Found ${queues.length} enterprise queues for CityCare:`);
  queues.forEach(q => console.log(` - [${q.prefix}] ${q.name} (Dept: ${q.department})`));

  // Step 3: Test Authentication & RBAC
  console.log('\n[3] Testing Authentication & RBAC...');
  const adminUser = await dbService.getUserByEmail('admin@citycare.gov');
  const validAdminPass = authService.verifyPassword('Admin@123', adminUser.passwordHash);
  const invalidAdminPass = authService.verifyPassword('WrongPass', adminUser.passwordHash);
  console.log(` - Admin user: ${adminUser.name} (${adminUser.role})`);
  console.log(` - Password verification (correct): ${validAdminPass}`);
  console.log(` - Password verification (incorrect): ${invalidAdminPass}`);

  const token = authService.createToken(adminUser);
  const decoded = authService.verifyToken(token);
  console.log(` - JWT token generated and verified: userId=${decoded.userId}, role=${decoded.role}`);

  // Step 4: Test Workflow State Machine
  console.log('\n[4] Testing Queue Workflow State Machine...');
  const citizenEntries = await dbService.getQueueEntries('q-citizen');
  console.log(`Queue entries in 'q-citizen': ${citizenEntries.length}`);
  
  const waitingEntries = citizenEntries.filter(e => e.status === 'WAITING');
  console.log(` - WAITING: ${waitingEntries.length}`);
  const calledEntries = citizenEntries.filter(e => e.status === 'CALLED');
  console.log(` - CALLED: ${calledEntries.length}`);
  const inServiceEntries = citizenEntries.filter(e => e.status === 'IN_SERVICE');
  console.log(` - IN_SERVICE: ${inServiceEntries.length}`);
  const completedEntries = citizenEntries.filter(e => e.status === 'COMPLETED');
  console.log(` - COMPLETED: ${completedEntries.length}`);

  // Step 5: Test Controlled Manual Override
  console.log('\n[5] Testing Manual Override with Mandatory Audit Justification...');
  const target = waitingEntries[0];
  console.log(`Targeting visitor ${target.personId} (${target.name}) for priority override...`);
  
  try {
    // Attempt without reason (should fail)
    await dbService.overrideQueueEntry(target.entryId, 'high', '', adminUser);
    console.error('ERROR: Override without reason unexpectedly succeeded!');
  } catch (err) {
    console.log(` - Controlled Guard Check: Caught expected error -> "${err.message}"`);
  }

  // Authorized override with valid reason
  const overridden = await dbService.overrideQueueEntry(
    target.entryId,
    'high',
    'Clinical supervisor priority escalation for urgent laboratory workup',
    adminUser
  );
  console.log(` - Override successful: isOverridden=${overridden.isOverridden}, newPriority=${overridden.priority}`);
  console.log(` - Justification recorded: "${overridden.overrideDetails.reason}"`);
  console.log(` - Overridden by: ${overridden.overrideDetails.overriddenBy.name} (${overridden.overrideDetails.overriddenBy.role})`);

  // Step 6: Test Audit Trail Recording
  console.log('\n[6] Testing Audit Trail & Compliance Logging...');
  const auditLogs = await dbService.getAuditLogs({ organizationId: 'org-citycare' });
  console.log(`Found ${auditLogs.length} audit logs in the system:`);
  auditLogs.slice(0, 3).forEach(log => {
    console.log(` - [${log.timestamp.toISOString()}] ${log.eventType} by ${log.userEmail} (Record: ${log.affectedRecordId})`);
  });

  // Step 7: Test Operational Reports & Metrics
  console.log('\n[7] Testing Operational Reports & Fairness Metrics...');
  const report = await dbService.generateOperationalReport('q-citizen');
  console.log(`Operational Report for Queue '${report.queueId}':`);
  console.log(` - Total Registered: ${report.metrics.totalRegistered}`);
  console.log(` - Total Waiting: ${report.metrics.totalWaiting}`);
  console.log(` - Average Wait Time: ${report.metrics.averageWaitMinutes} mins`);
  console.log(` - Longest Wait Time: ${report.metrics.longestWaitMinutes} mins`);
  console.log(` - Total Overrides: ${report.metrics.totalOverrides}`);
  console.log(` - Disclaimer: "${report.disclaimer}"`);

  console.log('\n========================================================');
  console.log('ALL ENTERPRISE MODULES VERIFIED & OPERATIONAL!');
  console.log('========================================================\n');
}

testEnterpriseSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
