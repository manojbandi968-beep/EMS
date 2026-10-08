import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_BASE = `http://localhost:${process.env.PORT || 5000}/api`;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables in server/.env');
  process.exit(1);
}

// Privileged client for test fixtures & user provisioning (kept strictly server-side)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Standard anon client for user auth simulation
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = [];
const createdUserIds = [];
const createdEventIds = [];

function recordTest(name, passed, details = '') {
  results.push({ name, status: passed ? 'PASS' : 'FAIL', details });
  const badge = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${badge}] ${name}${details ? ` -> ${details}` : ''}`);
}

// Helper to provision authenticated test user
async function createTestAttendee(namePrefix) {
  const email = `${namePrefix.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@gmail.com`;
  const password = 'Password123!';
  const fullName = `${namePrefix} Tester`;

  const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr || !userData.user) {
    throw new Error(`Failed to provision test user: ${createErr?.message}`);
  }

  const userId = userData.user.id;
  createdUserIds.push(userId);

  // Ensure matching row in profiles table
  await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      role: 'user',
    },
    { onConflict: 'id' }
  );

  // Sign in using standard anon client to obtain authentic JWT Bearer token
  const { data: sessionData, error: loginErr } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (loginErr || !sessionData.session) {
    throw new Error(`Failed to sign in test user: ${loginErr?.message}`);
  }

  return {
    userId,
    email,
    fullName,
    token: sessionData.session.access_token,
  };
}

async function runE2E() {
  console.log('=================================================================');
  console.log('      EVENT MANAGEMENT SYSTEM (EMS) - FULL E2E TEST SUITE        ');
  console.log('=================================================================\n');

  let adminToken = '';
  let categoryId = '';
  let standardEventId = '';
  let uploadedBannerUrl = '';

  // -------------------------------------------------------------
  // TEST 1: Health Endpoint
  // -------------------------------------------------------------
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status === 200 && healthData.success === true && healthData.message === 'Event API is running') {
      recordTest('Health Endpoint', true, 'GET /api/health returned 200 OK');
    } else {
      recordTest('Health Endpoint', false, `Status: ${healthRes.status}, Body: ${JSON.stringify(healthData)}`);
    }
  } catch (err) {
    recordTest('Health Endpoint', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Categories and Public Events
  // -------------------------------------------------------------
  try {
    const catRes = await fetch(`${API_BASE}/categories`);
    const catData = await catRes.json();

    const eventsRes = await fetch(`${API_BASE}/events`);
    const eventsData = await eventsRes.json();

    const catOk = catRes.status === 200 && catData.success === true && Array.isArray(catData.data) && catData.data.length > 0;
    const eventsOk = eventsRes.status === 200 && eventsData.success === true && Array.isArray(eventsData.data);

    if (catOk && eventsOk) {
      categoryId = catData.data[0].id;
      recordTest('Categories and Public Events', true, `Loaded ${catData.data.length} categories and ${eventsData.data.length} public events`);
    } else {
      recordTest('Categories and Public Events', false, `Categories OK: ${catOk}, Events OK: ${eventsOk}`);
    }
  } catch (err) {
    recordTest('Categories and Public Events', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Admin Authentication and Event Creation
  // -------------------------------------------------------------
  try {
    const adminEmail = 'testuser_1791355101408@example.com';
    const adminPassword = 'Password123!';

    const { data: adminAuthData, error: adminAuthError } = await supabaseClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (adminAuthError || !adminAuthData.session) {
      throw new Error(`Admin authentication failed: ${adminAuthError?.message}`);
    }

    adminToken = adminAuthData.session.access_token;

    // Verify admin privileges on dashboard
    const dashRes = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();
    if (dashRes.status !== 200 || !dashData.success) {
      throw new Error(`Admin dashboard query failed: ${JSON.stringify(dashData)}`);
    }

    // Upload banner to Supabase Storage event-banners bucket
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const bannerBlob = new Blob([pngBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('banner', bannerBlob, 'e2e-test-banner.png');

    const uploadRes = await fetch(`${API_BASE}/events/upload-banner`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();

    if (uploadRes.status !== 200 || !uploadData.success || !uploadData.data?.publicUrl) {
      throw new Error(`Banner upload failed: ${JSON.stringify(uploadData)}`);
    }
    uploadedBannerUrl = uploadData.data.publicUrl;

    // Create a new published event
    const eventPayload = {
      title: `E2E Tech Summit ${Date.now()}`,
      description: 'End-to-end automated verification conference.',
      banner_url: uploadedBannerUrl,
      category_id: categoryId,
      event_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      end_date: new Date(Date.now() + 86400000 * 3 + 14400000).toISOString(),
      venue: 'Global Convention Center',
      address: '500 Technology Way',
      capacity: 50,
      status: 'published',
    };

    const createRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });
    const createData = await createRes.json();

    if ((createRes.status === 201 || createRes.status === 200) && createData.success && createData.data?.id) {
      standardEventId = createData.data.id;
      createdEventIds.push(standardEventId);
      recordTest(
        'Admin Authentication and Event Creation',
        true,
        `Admin authenticated & event created (ID: ${standardEventId})`
      );
    } else {
      recordTest('Admin Authentication and Event Creation', false, `Status: ${createRes.status}, Body: ${JSON.stringify(createData)}`);
    }
  } catch (err) {
    recordTest('Admin Authentication and Event Creation', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Banner URL Display
  // -------------------------------------------------------------
  try {
    const singleEventRes = await fetch(`${API_BASE}/events/${standardEventId}`);
    const singleEventData = await singleEventRes.json();

    const publicListRes = await fetch(`${API_BASE}/events`);
    const publicListData = await publicListRes.json();
    const listedEvent = publicListData.data?.find((e) => e.id === standardEventId);

    const matchSingle = singleEventData.data?.banner_url === uploadedBannerUrl;
    const matchPublic = listedEvent?.banner_url === uploadedBannerUrl;

    if (matchSingle && matchPublic && uploadedBannerUrl.includes('event-banners')) {
      recordTest('Banner URL Display', true, `Storage banner served on public endpoints: ${uploadedBannerUrl}`);
    } else {
      recordTest('Banner URL Display', false, `MatchSingle: ${matchSingle}, MatchPublic: ${matchPublic}`);
    }
  } catch (err) {
    recordTest('Banner URL Display', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Attendee Registration
  // -------------------------------------------------------------
  let attendee1 = null;
  let attendee1RegId = '';
  let attendee1TicketCode = '';
  try {
    attendee1 = await createTestAttendee('Alex');

    const regRes = await fetch(`${API_BASE}/events/${standardEventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${attendee1.token}` },
    });
    const regData = await regRes.json();

    if ((regRes.status === 201 || regRes.status === 200) && regData.success && regData.data?.ticket_code) {
      attendee1RegId = regData.data.id;
      attendee1TicketCode = regData.data.ticket_code;

      // Verify in /api/registrations/me
      const myRegRes = await fetch(`${API_BASE}/registrations/me`, {
        headers: { Authorization: `Bearer ${attendee1.token}` },
      });
      const myRegData = await myRegRes.json();
      const myItem = myRegData.data?.find((r) => r.id === attendee1RegId);

      if (myItem && myItem.ticket_code === attendee1TicketCode && myItem.status === 'confirmed') {
        recordTest('Attendee Registration', true, `Registered with unique Ticket Code: ${attendee1TicketCode}`);
      } else {
        throw new Error('Registration not found or status not confirmed in /api/registrations/me');
      }
    } else {
      recordTest('Attendee Registration', false, `Status: ${regRes.status}, Body: ${JSON.stringify(regData)}`);
    }
  } catch (err) {
    recordTest('Attendee Registration', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Duplicate Registration Prevention
  // -------------------------------------------------------------
  try {
    if (!attendee1) throw new Error('Attendee 1 was not initialized');

    const dupRes = await fetch(`${API_BASE}/events/${standardEventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${attendee1.token}` },
    });
    const dupData = await dupRes.json();

    if (dupRes.status === 400 && dupData.success === false && dupData.message.includes('already hold an active registration')) {
      recordTest(
        'Duplicate Registration Prevention',
        true,
        `Rejected duplicate registration with 400 Bad Request ("${dupData.message}")`
      );
    } else {
      recordTest('Duplicate Registration Prevention', false, `Status: ${dupRes.status}, Expected 400. Body: ${JSON.stringify(dupData)}`);
    }
  } catch (err) {
    recordTest('Duplicate Registration Prevention', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Full-Capacity Prevention
  // -------------------------------------------------------------
  let capacityEventId = '';
  let attendee2 = null;
  let attendee3 = null;
  let attendee2RegId = '';
  try {
    // 1. Admin creates an event with strict capacity = 1
    const capPayload = {
      title: `E2E Exclusive Workshop ${Date.now()}`,
      description: 'VIP workshop with strict capacity of 1 attendee.',
      banner_url: uploadedBannerUrl,
      category_id: categoryId,
      event_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      end_date: new Date(Date.now() + 86400000 * 5 + 7200000).toISOString(),
      venue: 'Executive Boardroom',
      address: '200 High Tech Blvd',
      capacity: 1,
      status: 'published',
    };

    const capCreateRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(capPayload),
    });
    const capCreateData = await capCreateRes.json();
    if (!capCreateData.success || !capCreateData.data?.id) {
      throw new Error(`Failed to create capacity test event: ${JSON.stringify(capCreateData)}`);
    }
    capacityEventId = capCreateData.data.id;
    createdEventIds.push(capacityEventId);

    // 2. Attendee 2 claims the sole seat
    attendee2 = await createTestAttendee('Robin');
    const fillRes = await fetch(`${API_BASE}/events/${capacityEventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${attendee2.token}` },
    });
    const fillData = await fillRes.json();
    if (!fillData.success || !fillData.data?.id) {
      throw new Error(`Attendee 2 failed to claim sole seat: ${JSON.stringify(fillData)}`);
    }
    attendee2RegId = fillData.data.id;

    // 3. Attendee 3 attempts to register when capacity is full (1/1)
    attendee3 = await createTestAttendee('Taylor');
    const overbookRes = await fetch(`${API_BASE}/events/${capacityEventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${attendee3.token}` },
    });
    const overbookData = await overbookRes.json();

    if (overbookRes.status === 400 && overbookData.success === false && overbookData.message.includes('maximum capacity')) {
      recordTest(
        'Full-Capacity Prevention',
        true,
        `Rejected overbooking with 400 Bad Request ("${overbookData.message}")`
      );
    } else {
      recordTest('Full-Capacity Prevention', false, `Status: ${overbookRes.status}, Expected 400. Body: ${JSON.stringify(overbookData)}`);
    }
  } catch (err) {
    recordTest('Full-Capacity Prevention', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Cancellation Updates Available Seats
  // -------------------------------------------------------------
  try {
    if (!attendee2 || !attendee3 || !capacityEventId) {
      throw new Error('Prerequisites for cancellation test were not met');
    }

    // Check count before cancellation
    const eventBeforeRes = await fetch(`${API_BASE}/events/${capacityEventId}`);
    const eventBeforeData = await eventBeforeRes.json();
    const countBefore = eventBeforeData.data.registered_count;
    const capacityTotal = eventBeforeData.data.capacity;
    const availableBefore = capacityTotal - countBefore;

    // Attendee 2 cancels their registration
    const cancelRes = await fetch(`${API_BASE}/registrations/${attendee2RegId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${attendee2.token}` },
    });
    const cancelData = await cancelRes.json();

    if (cancelRes.status !== 200 || !cancelData.success || cancelData.data?.status !== 'cancelled') {
      throw new Error(`Cancellation endpoint failed: ${JSON.stringify(cancelData)}`);
    }

    // Check count after cancellation
    const eventAfterRes = await fetch(`${API_BASE}/events/${capacityEventId}`);
    const eventAfterData = await eventAfterRes.json();
    const countAfter = eventAfterData.data.registered_count;
    const availableAfter = capacityTotal - countAfter;

    const countDecremented = countAfter === countBefore - 1;
    const seatsIncreased = availableAfter === availableBefore + 1;

    // Attendee 3 now claims the reopened seat
    const claimRes = await fetch(`${API_BASE}/events/${capacityEventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${attendee3.token}` },
    });
    const claimData = await claimRes.json();
    const claimSucceeded = (claimRes.status === 201 || claimRes.status === 200) && claimData.success === true;

    if (countDecremented && seatsIncreased && claimSucceeded) {
      recordTest(
        'Cancellation Updates Available Seats',
        true,
        `Available seats restored (+1). Waitlisted attendee successfully booked the reopened seat!`
      );
    } else {
      recordTest(
        'Cancellation Updates Available Seats',
        false,
        `CountDecremented: ${countDecremented}, SeatsIncreased: ${seatsIncreased}, ClaimSucceeded: ${claimSucceeded}`
      );
    }
  } catch (err) {
    recordTest('Cancellation Updates Available Seats', false, err.message);
  }

  // -------------------------------------------------------------
  // Clean up test events and provisioned test users
  // -------------------------------------------------------------
  console.log('\n--- Cleaning up test artifacts ---');
  try {
    for (const eid of createdEventIds) {
      await fetch(`${API_BASE}/events/${eid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    console.log(`✓ Cleaned up ${createdEventIds.length} test events`);
  } catch (e) {
    // ignore
  }

  try {
    for (const uid of createdUserIds) {
      await supabaseAdmin.from('profiles').delete().eq('id', uid);
      await supabaseAdmin.auth.admin.deleteUser(uid);
    }
    console.log(`✓ Cleaned up ${createdUserIds.length} provisioned test users`);
  } catch (e) {
    // ignore
  }

  // -------------------------------------------------------------
  // FINAL SCORECARD
  // -------------------------------------------------------------
  console.log('\n=================================================================');
  console.log('                      E2E VERIFICATION REPORT                    ');
  console.log('=================================================================');
  let allPassed = true;
  for (const t of results) {
    const padName = t.name.padEnd(42, ' ');
    const tag = t.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${padName} | ${tag} | ${t.details}`);
    if (t.status !== 'PASS') allPassed = false;
  }
  console.log('=================================================================\n');

  if (allPassed && results.length === 8) {
    console.log('🎉 ALL 8 E2E TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('⚠️ ONE OR MORE E2E TESTS FAILED.\n');
    process.exit(1);
  }
}

runE2E().catch((err) => {
  console.error('Fatal E2E test suite error:', err);
  process.exit(1);
});
