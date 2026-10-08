import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qpalwnbnmxotdyrxixmz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwYWx3bmJubXhvdGR5cnhpeG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNDczOTAsImV4cCI6MjEwNjkyMzM5MH0.PxvOwmXkxEmie5gj6K9yIjJ4cJgkPZPFHKb1wil0G9k';
const API_BASE = 'http://localhost:5000/api';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runE2E() {
  console.log('====================================================');
  console.log('   EVENT MANAGEMENT SYSTEM - END-TO-END VERIFICATION');
  console.log('====================================================\n');

  // TEST 1: Admin Login
  console.log('--- TEST 1: Admin Login ---');
  const adminEmail = 'testuser_1791355101408@example.com';
  const adminPassword = 'Password123!';

  const { data: adminAuthData, error: adminAuthError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (adminAuthError || !adminAuthData.session) {
    throw new Error(`Admin login failed: ${adminAuthError?.message}`);
  }

  const adminToken = adminAuthData.session.access_token;
  console.log(`✓ Admin logged in successfully! User ID: ${adminAuthData.user.id}`);

  // Verify Admin privileges via backend
  const dashRes = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dashData = await dashRes.json();
  if (!dashData.success) {
    throw new Error(`Admin dashboard access denied: ${JSON.stringify(dashData)}`);
  }
  console.log('✓ Admin dashboard access verified! Stats:', dashData.data.stats);

  // Get categories to link the event
  const catRes = await fetch(`${API_BASE}/categories`);
  const catData = await catRes.json();
  if (!catData.success || !catData.data.length) {
    throw new Error('Categories fetch failed');
  }
  const categoryId = catData.data[0].id;
  const categoryName = catData.data[0].name;
  console.log(`✓ Category retrieved: "${categoryName}" (${categoryId})`);

  // TEST 2: Create and Publish an Event with Banner Image (Supabase Storage)
  console.log('\n--- TEST 2: Create and Publish Event with Banner Image ---');
  // 1x1 PNG image as buffer
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  const bannerFile = new Blob([pngBuffer], { type: 'image/png' });

  const formData = new FormData();
  formData.append('banner', bannerFile, 'e2e-test-banner.png');

  console.log('Uploading banner to Supabase Storage event-banners bucket...');
  const uploadRes = await fetch(`${API_BASE}/events/upload-banner`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const uploadData = await uploadRes.json();

  if (!uploadData.success || !uploadData.data?.publicUrl) {
    throw new Error(`Banner upload failed: ${JSON.stringify(uploadData)}`);
  }
  const uploadedBannerUrl = uploadData.data.publicUrl;
  console.log(`✓ Banner uploaded to Supabase Storage: ${uploadedBannerUrl}`);

  // Create event with this banner
  const eventTitle = `E2E Tech Summit ${Date.now()}`;
  const eventPayload = {
    title: eventTitle,
    description: 'Premier end-to-end conference testing event management system.',
    banner_url: uploadedBannerUrl,
    category_id: categoryId,
    event_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 5 + 14400000).toISOString(),
    venue: 'San Francisco Convention Center',
    address: '747 Howard St, San Francisco, CA',
    capacity: 50,
    status: 'published',
  };

  const createEventRes = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });
  const createEventData = await createEventRes.json();
  if (!createEventData.success || !createEventData.data?.id) {
    throw new Error(`Event creation failed: ${JSON.stringify(createEventData)}`);
  }
  const createdEvent = createEventData.data;
  console.log(`✓ Event created and published! ID: ${createdEvent.id}, Title: "${createdEvent.title}"`);

  // TEST 3: Verify the banner appears on the public event page
  console.log('\n--- TEST 3: Verify Banner on Public Event Page ---');
  const publicEventsRes = await fetch(`${API_BASE}/events`);
  const publicEventsData = await publicEventsRes.json();
  const foundEvent = publicEventsData.data?.find((e) => e.id === createdEvent.id);

  if (!foundEvent) {
    throw new Error(`Created event ${createdEvent.id} not found in public events!`);
  }
  if (foundEvent.banner_url !== uploadedBannerUrl) {
    throw new Error(`Banner URL mismatch! Expected ${uploadedBannerUrl}, got ${foundEvent.banner_url}`);
  }
  if (foundEvent.status !== 'published') {
    throw new Error(`Event status is not published: ${foundEvent.status}`);
  }
  console.log(`✓ Public event confirmed! Title: "${foundEvent.title}", Banner: ${foundEvent.banner_url}`);

  // TEST 4: Register a normal user for the event
  console.log('\n--- TEST 4: Register Normal Attendee User ---');
  const attendeeEmail = `attendee_${Date.now()}@example.com`;
  const attendeePassword = 'Password123!';
  const attendeeName = 'Alex Attendee';

  const { data: attendeeSignUp, error: attendeeSignUpError } = await supabase.auth.signUp({
    email: attendeeEmail,
    password: attendeePassword,
    options: {
      data: { full_name: attendeeName },
    },
  });

  if (attendeeSignUpError || !attendeeSignUp.session) {
    throw new Error(`Attendee registration failed: ${attendeeSignUpError?.message}`);
  }

  const attendeeToken = attendeeSignUp.session.access_token;
  console.log(`✓ Attendee signed up: ${attendeeEmail} (ID: ${attendeeSignUp.user.id})`);

  // Register attendee for the event
  const regRes = await fetch(`${API_BASE}/events/${createdEvent.id}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${attendeeToken}` },
  });
  const regData = await regRes.json();

  if (!regData.success || !regData.data?.id) {
    throw new Error(`Registration for event failed: ${JSON.stringify(regData)}`);
  }
  const registrationRecord = regData.data;
  const ticketCode = registrationRecord.ticket_code;
  console.log(`✓ Event registration confirmed!`);
  console.log(`   Registration ID: ${registrationRecord.id}`);
  console.log(`   Ticket Code: ${ticketCode}`);
  console.log(`   Status: ${registrationRecord.status}`);

  // TEST 5: Verify My Registrations shows the ticket and event details
  console.log('\n--- TEST 5: Verify My Registrations ---');
  const myRegRes = await fetch(`${API_BASE}/registrations/me`, {
    headers: { Authorization: `Bearer ${attendeeToken}` },
  });
  const myRegData = await myRegRes.json();

  if (!myRegData.success || !Array.isArray(myRegData.data)) {
    throw new Error(`Failed to get attendee registrations: ${JSON.stringify(myRegData)}`);
  }

  const myRegItem = myRegData.data.find((r) => r.id === registrationRecord.id);
  if (!myRegItem) {
    throw new Error(`Registration not found in /api/registrations/me`);
  }
  if (myRegItem.ticket_code !== ticketCode) {
    throw new Error(`Ticket code mismatch: expected ${ticketCode}, got ${myRegItem.ticket_code}`);
  }
  if (myRegItem.events?.id !== createdEvent.id) {
    throw new Error(`Event detail mismatch in registration: ${JSON.stringify(myRegItem.events)}`);
  }
  if (myRegItem.status !== 'confirmed') {
    throw new Error(`Expected registration status 'confirmed', got '${myRegItem.status}'`);
  }
  console.log(`✓ My Registrations verified:`);
  console.log(`   Event: ${myRegItem.events.title}`);
  console.log(`   Venue: ${myRegItem.events.venue}`);
  console.log(`   Ticket: ${myRegItem.ticket_code}`);
  console.log(`   Status: ${myRegItem.status}`);

  // TEST 6: Verify Admin Registrations Table shows the attendee
  console.log('\n--- TEST 6: Verify Admin Registrations Table ---');
  const adminRegRes = await fetch(`${API_BASE}/admin/registrations`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminRegData = await adminRegRes.json();

  if (!adminRegData.success || !Array.isArray(adminRegData.data)) {
    throw new Error(`Failed to fetch admin registrations: ${JSON.stringify(adminRegData)}`);
  }

  const adminAttendeeRow = adminRegData.data.find((r) => r.id === registrationRecord.id);
  if (!adminAttendeeRow) {
    throw new Error(`Registration ${registrationRecord.id} not found in admin registrations table!`);
  }
  if (adminAttendeeRow.ticket_code !== ticketCode) {
    throw new Error(`Ticket code mismatch in admin table: ${adminAttendeeRow.ticket_code}`);
  }
  console.log(`✓ Admin registrations table verified:`);
  console.log(`   Attendee Full Name: ${adminAttendeeRow.profiles?.full_name}`);
  console.log(`   Ticket Code: ${adminAttendeeRow.ticket_code}`);
  console.log(`   Event Title: ${adminAttendeeRow.events?.title}`);
  console.log(`   Status: ${adminAttendeeRow.status}`);

  // TEST 7: Test Cancellation and Confirm Available Seats Increase Correctly
  console.log('\n--- TEST 7: Test Cancellation & Seat Capacity Count ---');
  // Check count before cancellation
  const eventBeforeCancelRes = await fetch(`${API_BASE}/events/${createdEvent.id}`);
  const eventBeforeCancel = await eventBeforeCancelRes.json();
  const registeredBefore = eventBeforeCancel.data.registered_count;
  const capacity = eventBeforeCancel.data.capacity;
  const availableBefore = capacity - registeredBefore;
  console.log(`Before cancellation: registered_count = ${registeredBefore}, capacity = ${capacity}, available = ${availableBefore}`);

  // Cancel registration
  const cancelRes = await fetch(`${API_BASE}/registrations/${registrationRecord.id}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${attendeeToken}` },
  });
  const cancelData = await cancelRes.json();

  if (!cancelData.success || cancelData.data?.status !== 'cancelled') {
    throw new Error(`Cancellation failed: ${JSON.stringify(cancelData)}`);
  }
  console.log(`✓ Registration cancelled successfully. Response status: ${cancelData.data.status}`);

  // Check event registered_count after cancellation
  const eventAfterCancelRes = await fetch(`${API_BASE}/events/${createdEvent.id}`);
  const eventAfterCancel = await eventAfterCancelRes.json();
  const registeredAfter = eventAfterCancel.data.registered_count;
  const availableAfter = capacity - registeredAfter;
  console.log(`After cancellation: registered_count = ${registeredAfter}, available = ${availableAfter}`);

  if (registeredAfter !== registeredBefore - 1) {
    throw new Error(`registered_count did not decrement! Before: ${registeredBefore}, After: ${registeredAfter}`);
  }
  if (availableAfter !== availableBefore + 1) {
    throw new Error(`available seats did not increase! Before: ${availableBefore}, After: ${availableAfter}`);
  }
  console.log(`✓ Available seats correctly increased by 1 (from ${availableBefore} to ${availableAfter})!`);

  // Verify /registrations/me status is updated
  const myRegAfterCancel = await fetch(`${API_BASE}/registrations/me`, {
    headers: { Authorization: `Bearer ${attendeeToken}` },
  }).then((r) => r.json());
  const myCancelledReg = myRegAfterCancel.data.find((r) => r.id === registrationRecord.id);
  if (myCancelledReg.status !== 'cancelled') {
    throw new Error(`Expected registration status 'cancelled', got '${myCancelledReg.status}'`);
  }
  console.log(`✓ Attendee's registrations view correctly reflects status: "${myCancelledReg.status}"`);

  // Clean up created test event
  console.log('\n--- Cleaning up test event ---');
  await fetch(`${API_BASE}/events/${createdEvent.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('✓ Cleaned up test event.');

  console.log('\n====================================================');
  console.log('   ALL E2E TEST CRITERIA 1 - 7 PASSED WITH FLYING COLORS! ');
  console.log('====================================================');
}

runE2E().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
