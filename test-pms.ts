import { agencySchema } from './lib/validations/agency';
import { cboSchema } from './lib/validations/cbo';
import { participantSchema } from './lib/validations/participant';
import { mockStore } from './lib/supabase/mock-store';
import { getOrganizedHierarchy } from './app/actions/organized-list';

async function runVerification() {
  console.log('--- RUNNING PARTICIPANT MANAGEMENT SYSTEM VERIFICATION ---');

  // 1. Test Zod Validations
  console.log('\n[1] Testing Zod Schemas...');
  const agencyValid = agencySchema.safeParse({ name: 'Agency A' });
  const agencyInvalid = agencySchema.safeParse({ name: 'A' });
  if (!agencyValid.success || agencyInvalid.success) {
    throw new Error('Agency validation failed!');
  }
  console.log('✔ Agency schema correctly validates inputs.');

  const cboValid = cboSchema.safeParse({
    partner_agency_id: 'some-uuid',
    name: 'CBO Branch 1',
  });
  const cboInvalid = cboSchema.safeParse({ partner_agency_id: '', name: 'C' });
  if (!cboValid.success || cboInvalid.success) {
    throw new Error('CBO validation failed!');
  }
  console.log('✔ CBO schema correctly validates inputs.');

  const participantValid = participantSchema.safeParse({
    partner_agency_id: 'agency-1',
    cbo_id: 'cbo-1',
    name: 'Juan Dela Cruz',
    status: 'Confirmed',
  });
  const participantInvalidStatus = participantSchema.safeParse({
    partner_agency_id: 'agency-1',
    cbo_id: 'cbo-1',
    name: 'Juan Dela Cruz',
    status: 'UnknownStatus',
  });
  if (!participantValid.success || participantInvalidStatus.success) {
    throw new Error('Participant validation failed!');
  }
  console.log('✔ Participant schema correctly enforces status enum and fields.');

  // 2. Test In-Memory Store & Relational Flow
  console.log('\n[2] Testing Relational CRUD & Status/Date Logic...');
  const initialParticipants = mockStore.getParticipants();
  const confirmedP = initialParticipants.find((p) => p.status === 'Confirmed');
  if (!confirmedP || !confirmedP.date_confirmed) {
    throw new Error('Confirmed participant must have date_confirmed!');
  }
  console.log(`✔ Confirmed participant "${confirmedP.name}" has date_confirmed: ${confirmedP.date_confirmed}`);

  const pendingP = initialParticipants.find((p) => p.status === 'Pending');
  if (!pendingP || pendingP.date_confirmed !== null) {
    throw new Error('Pending participant must have null date_confirmed!');
  }
  console.log(`✔ Pending participant "${pendingP.name}" has date_confirmed: null.`);

  // Test status switch to Confirmed
  const updatedToConfirmed = mockStore.updateParticipantStatus(pendingP.id, 'Confirmed');
  if (!updatedToConfirmed || !updatedToConfirmed.date_confirmed) {
    throw new Error('Changing status to Confirmed must set date_confirmed!');
  }
  console.log(`✔ Updated "${pendingP.name}" to Confirmed: date_confirmed was automatically set to ${updatedToConfirmed.date_confirmed}`);

  // Test status switch away from Confirmed
  const updatedBackToPending = mockStore.updateParticipantStatus(pendingP.id, 'Pending');
  if (!updatedBackToPending || updatedBackToPending.date_confirmed !== null) {
    throw new Error('Changing status away from Confirmed must clear date_confirmed!');
  }
  console.log(`✔ Updated "${pendingP.name}" back to Pending: date_confirmed was automatically cleared.`);

  // 3. Test Organized List Hierarchy and Alphabetical Sorting
  console.log('\n[3] Testing Organized List Multi-Level Alphabetical Hierarchy...');
  const hierarchy = await getOrganizedHierarchy();

  // Verify alphabetical agencies
  for (let i = 0; i < hierarchy.length - 1; i++) {
    if (hierarchy[i].name.localeCompare(hierarchy[i + 1].name) > 0) {
      throw new Error(`Agencies not sorted alphabetically: ${hierarchy[i].name} before ${hierarchy[i + 1].name}`);
    }
  }
  console.log(`✔ All ${hierarchy.length} agencies are sorted alphabetically.`);

  // Verify CBOs under agencies
  for (const agency of hierarchy) {
    for (let j = 0; j < agency.cbos.length - 1; j++) {
      if (agency.cbos[j].name.localeCompare(agency.cbos[j + 1].name) > 0) {
        throw new Error(`CBOs under agency "${agency.name}" not sorted alphabetically!`);
      }
    }
    // Verify Participants under CBOs
    for (const cbo of agency.cbos) {
      for (let k = 0; k < cbo.participants.length - 1; k++) {
        if (cbo.participants[k].name.localeCompare(cbo.participants[k + 1].name) > 0) {
          throw new Error(`Participants under CBO "${cbo.name}" not sorted alphabetically!`);
        }
      }
    }
  }
  console.log('✔ All CBOs within each agency and all participants within each CBO are sorted alphabetically.');

  // Print hierarchy preview
  console.log('\n[Hierarchy Tree Preview]:');
  for (const agency of hierarchy) {
    console.log(`${agency.name}`);
    for (const cbo of agency.cbos) {
      console.log(`    ${cbo.name}`);
      for (const p of cbo.participants) {
        console.log(`        ${p.name} — ${p.status}${p.date_confirmed ? ' (Confirmed: ' + p.date_confirmed.substring(0, 10) + ')' : ''}`);
      }
    }
  }

  console.log('\n✔ ALL AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

