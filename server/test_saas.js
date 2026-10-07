// ==============================================================================
// FAIRQUEUE SaaS End-to-End Automated Integration Verification Suite
// ==============================================================================

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('\n================================================================');
  console.log(' STARTING FAIRQUEUE SAAS AUTOMATED VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Helper for requests with cookies/headers
  let sessionCookie = '';
  let bearerToken = '';

  async function req(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { 'Cookie': sessionCookie } : {}),
      ...(bearerToken ? { 'Authorization': `Bearer ${bearerToken}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // Capture set-cookie
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: res.headers };
  }

  // 1. System Status API
  console.log('\n--- 1. SYSTEM TELEMETRY & API STATUS ---');
  const statusRes = await req('/api/status');
  assert(statusRes.status === 200, 'GET /api/status returned 200 OK');
  assert(statusRes.data.prologEngine?.status === 'online' || statusRes.data.prologEngine?.embeddedEngine, 'Prolog Inference Engine is online and verified');
  assert(statusRes.data.database?.status === 'connected' || statusRes.data.database?.status === 'in-memory-ready' || statusRes.data.database?.mode, 'Database layer is active and ready');

  // 2. Demo User Authentication (Dr. Robert Chen - ORGANIZATION_ADMIN)
  console.log('\n--- 2. DEMO USER AUTHENTICATION & RBAC ---');
  const demoLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@citycare.gov', password: 'Admin@123' }),
  });
  assert(demoLogin.status === 200, 'Demo admin login successful');
  assert(demoLogin.data.user?.email === 'admin@citycare.gov', 'User email verified');
  const org = demoLogin.data.organization || demoLogin.data.activeOrganization;
  const role = demoLogin.data.role || demoLogin.data.activeRole;
  assert(org?.organizationId === 'org-citycare', 'Active organization resolved to CityCare');
  assert(role === 'ORGANIZATION_ADMIN', 'Role resolved to ORGANIZATION_ADMIN');

  // Check demo queues
  const demoQueues = await req('/api/queues');
  assert(demoQueues.status === 200 && demoQueues.data.data.length >= 3, 'CityCare has provisioned production queues');

  // 3. New User Registration Flow
  console.log('\n--- 3. NEW USER REGISTRATION & PASSWORD HASHING ---');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testEmail = `director.${randomSuffix}@metrohealth.org`;
  const testPassword = 'SecurePassword@2026';

  // Test validation: short password
  const shortPassRes = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Evelyn Reed',
      email: testEmail,
      password: '123',
      confirmPassword: '123',
    }),
  });
  assert(shortPassRes.status === 400, 'Short password (< 8 chars) properly rejected');

  // Valid registration
  const registerRes = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Evelyn Reed',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  assert(registerRes.status === 201, 'New user successfully registered');
  assert(registerRes.data.user?.name === 'Dr. Evelyn Reed', 'New user profile created');
  assert(sessionCookie.includes('fairqueue_session='), 'HTTP-Only session cookie issued upon registration');

  bearerToken = registerRes.data.token;

  // Test duplicate registration rejection
  const dupRes = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Evelyn Reed',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  assert(dupRes.status === 409, 'Duplicate email registration safely rejected with 409 Conflict');

  // 4. Onboarding: Organization Creation
  console.log('\n--- 4. ONBOARDING: ORGANIZATION CREATION ---');
  const createOrgRes = await req('/api/organizations', {
    method: 'POST',
    body: JSON.stringify({
      name: 'MetroHealth Emergency Trauma Network',
      type: 'Healthcare',
      description: 'Acute triage, trauma evaluation, and emergency specialty desks.',
    }),
  });
  assert(createOrgRes.status === 201, 'New organization created');
  const newOrg = createOrgRes.data.organization || createOrgRes.data.data;
  const newOrgId = newOrg?.organizationId;
  assert(Boolean(newOrgId), `New organization assigned unique ID: ${newOrgId}`);

  // Verify authenticated identity now reflects ORGANIZATION_ADMIN in new org
  const meRes = await req('/api/auth/me');
  assert(meRes.data.role === 'ORGANIZATION_ADMIN' || meRes.data.activeRole === 'ORGANIZATION_ADMIN', 'Creator automatically designated ORGANIZATION_ADMIN');
  const activeOrg = meRes.data.organization || meRes.data.activeOrganization;
  assert(activeOrg?.organizationId === newOrgId, 'Active organization updated');

  // 5. Onboarding: First Queue Creation
  console.log('\n--- 5. ONBOARDING: QUEUE CREATION & ZERO-DATA VERIFICATION ---');
  const createQueueRes = await req('/api/queues', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Acute Triage & Trauma Desk',
      prefix: 'TR',
      department: 'Emergency & Trauma Care',
      targetServiceMinutes: 8,
      description: 'Initial physical and clinical assessment counter.',
    }),
  });
  assert(createQueueRes.status === 201, 'New queue desk created');
  const newQueueId = createQueueRes.data.data.queueId;
  assert(Boolean(newQueueId), `New queue assigned unique ID: ${newQueueId}`);

  // VERIFY ZERO FAKE DATA
  const initialEntries = await req(`/api/queues/${newQueueId}/entries`);
  assert(initialEntries.status === 200, 'Fetched new queue entries');
  assert(initialEntries.data.data.length === 0, 'ZERO fake data: New organization queue starts with 0 entries');

  // 6. Strict Multi-Tenant Data Isolation Check
  console.log('\n--- 6. MULTI-TENANT ISOLATION ENFORCEMENT ---');
  // Attempt to query CityCare demo queue with MetroHealth session
  const crossTenantRes = await req('/api/queues/q-citizen/entries');
  assert(crossTenantRes.status === 403 || crossTenantRes.status === 404, 'Cross-tenant queue access strictly blocked or isolated');

  // 7. Real Data Addition & First-Order Horn Clause Deduction
  console.log('\n--- 7. VISITOR REGISTRATION & PROLOG REASONING ENGINE ---');
  const addPersonRes = await req(`/api/queues/${newQueueId}/entries`, {
    method: 'POST',
    body: JSON.stringify({
      personId: 'V101',
      name: 'Marcus Vance',
      waitingTime: 45,
      urgency: 'high',
      appointmentStatus: 'walkin',
      specialRequirement: 'elderly',
      arrivalTime: '14:15',
    }),
  });
  assert(addPersonRes.status === 201, 'Real visitor V101 registered in queue');

  const addPersonRes2 = await req(`/api/queues/${newQueueId}/entries`, {
    method: 'POST',
    body: JSON.stringify({
      personId: 'V102',
      name: 'Julia Santos',
      waitingTime: 15,
      urgency: 'medium',
      appointmentStatus: 'scheduled',
      specialRequirement: 'none',
      arrivalTime: '14:45',
    }),
  });
  assert(addPersonRes2.status === 201, 'Real visitor V102 registered in queue');

  // Execute Prolog Deductive Analysis
  const analyzeRes = await req(`/api/analyze?queueId=${newQueueId}`, {
    method: 'POST',
  });
  assert(analyzeRes.status === 200, 'Prolog deductive analysis succeeded');
  const countAnalyzed = analyzeRes.data.summary?.totalAnalyzed || analyzeRes.data.stats?.totalPeople || analyzeRes.data.rankedQueue?.length;
  assert(countAnalyzed === 2, 'Prolog evaluated both registered visitors');
  assert(analyzeRes.data.rankedQueue?.length === 2, 'Prolog returned deterministic ranked queue order');
  
  // Verify explainability and deduction proofs
  const v101Proof = analyzeRes.data.rankedQueue.find(p => p.personId === 'V101');
  assert(v101Proof?.priority === 'critical' || v101Proof?.priority === 'high', `V101 evaluated to priority: ${v101Proof?.priority}`);
  const rules = v101Proof?.rulesApplied || v101Proof?.ruleCodes || v101Proof?.rules;
  assert(Array.isArray(rules) && rules.length > 0, 'Prolog provided Horn clause rule proof triggers');
  assert(Boolean(v101Proof?.explanation), `Proof explanation: "${v101Proof?.explanation}"`);

  // 8. Workflow Operations (Call Next, Update Status, Manual Override)
  console.log('\n--- 8. WORKFLOW CONTROLS & MANUAL OVERRIDE GOVERNANCE ---');
  const callNextRes = await req(`/api/queues/${newQueueId}/entries/call-next`, {
    method: 'POST',
  });
  assert(callNextRes.status === 200, `Called top ticket ${callNextRes.data.data?.personId} to counter`);

  // Controlled Manual Override with Mandatory Reason
  const overrideRes = await req(`/api/queues/${newQueueId}/entries/V102/override`, {
    method: 'POST',
    body: JSON.stringify({
      newPriority: 'critical',
      overrideReason: 'Severe anaphylactic allergic reaction presented at service counter.',
    }),
  });
  assert(overrideRes.status === 200, 'Manual priority override recorded');
  const overriddenEntry = overrideRes.data.entry || overrideRes.data.data;
  assert(overriddenEntry?.isOverridden === true, 'Entry flagged as overridden');

  // Check audit log for the override
  const auditRes = await req(`/api/audit?queueId=${newQueueId}`);
  assert(auditRes.status === 200, 'Audit log query successful');
  const overrideLog = auditRes.data.data.find(l => l.eventType === 'MANUAL_OVERRIDE_RECORDED');
  assert(Boolean(overrideLog), 'Override event indelibly recorded in organization audit ledger');

  // 9. Team Management & Member Invitations
  console.log('\n--- 9. TEAM MANAGEMENT & INVITATIONS ---');
  const inviteRes = await req('/api/organizations/current/invitations', {
    method: 'POST',
    body: JSON.stringify({
      email: `triage.nurse.${randomSuffix}@metrohealth.org`,
      role: 'OPERATOR',
    }),
  });
  assert(inviteRes.status === 201, 'Team member invitation dispatched');
  assert(Boolean(inviteRes.data.invitation?.tokenHash), 'Cryptographic invitation token generated');

  const membersRes = await req('/api/organizations/current/members');
  assert(membersRes.status === 200 && membersRes.data.data.length >= 1, 'Fetched organization members roster');

  // 10. Profile Update & Password Change
  console.log('\n--- 10. PROFILE UPDATE & CREDENTIAL ROTATION ---');
  const updateProfileRes = await req('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Dr. Evelyn Reed, MD, PhD',
      currentPassword: testPassword,
      newPassword: 'UpdatedPassword@2026',
      confirmPassword: 'UpdatedPassword@2026',
    }),
  });
  assert(updateProfileRes.status === 200, 'Profile and password updated successfully');
  const updatedUser = updateProfileRes.data.user || updateProfileRes.data.data;
  assert(updatedUser?.name === 'Dr. Evelyn Reed, MD, PhD', 'Name change confirmed');

  // 11. Password Reset Flow (Forgot & Reset)
  console.log('\n--- 11. PASSWORD RESET LIFECYCLE ---');
  const forgotRes = await req('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail }),
  });
  assert(forgotRes.status === 200, 'Forgot password request processed');
  const resetToken = forgotRes.data.devToken || forgotRes.data.devResetToken || (forgotRes.data.devResetUrl ? forgotRes.data.devResetUrl.split('token=')[1] : null);
  assert(Boolean(resetToken), 'Development reset token extracted for testing');

  if (resetToken) {
    const resetRes = await req('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: resetToken,
        password: 'FinalPassword@2026',
        confirmPassword: 'FinalPassword@2026',
      }),
    });
    assert(resetRes.status === 200, 'Password successfully reset with valid security token');
  }

  // 12. Logout
  console.log('\n--- 12. LOGOUT & SESSION TERMINATION ---');
  const logoutRes = await req('/api/auth/logout', { method: 'POST' });
  assert(logoutRes.status === 200, 'User logged out and session cleared');

  console.log('\n================================================================');
  console.log(` VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('[FATAL TEST ERROR]', err);
  process.exit(1);
});
