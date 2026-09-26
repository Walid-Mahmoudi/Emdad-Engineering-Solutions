/**
 * EMDAD NEXUS - Standalone Google Sheets -> Supabase source sync
 *
 * This script is intentionally SELF-CONTAINED.
 * It does not depend on the old CRM Apps Script project, CONFIG,
 * headerIndexes_(), or any other legacy function.
 *
 * Put this file in a standalone Google Apps Script project that has
 * access to the source Google Sheet.
 *
 * One-time setup:
 *   1) Project Settings -> Script Properties
 *      NEXUS_SUPABASE_SYNC_SECRET = <your sync secret>
 *   2) Run installNexusSourceSync() once.
 *
 * The trigger runs every 15 minutes.
 *
 * Source-owned fields sent to NEXUS:
 *   Project_ID, Project_Name, Client, Source_Case, Offer_Sent, Sales_Person
 *
 * IMPORTANT:
 *   Blank Sales Person values remain blank. They are NEVER auto-assigned.
 *
 * The sync endpoint updates only source-owned fields. CRM-owned data such as
 * stage, estimated value, follow-ups, contracts, collections, notes and
 * lost reason is preserved by the Supabase Edge Function.
 */

const NEXUS_SOURCE_SPREADSHEET_ID =
  '1Qk-2V-RLSLpz9PoTttA-XrnZP3_n15jNRSfnGARiUXU';

const NEXUS_SOURCE_SHEET_ID = 2048855263;

const NEXUS_SUPABASE_SYNC_URL =
  'https://mlqujqoxedosqbmlecwf.supabase.co/functions/v1/sync-source-projects';

function getNexusSyncSecret_() {
  const secret = PropertiesService.getScriptProperties()
    .getProperty('NEXUS_SUPABASE_SYNC_SECRET');

  if (!secret || !secret.trim()) {
    throw new Error(
      'Missing Script Property: NEXUS_SUPABASE_SYNC_SECRET. ' +
      'Open Project Settings > Script Properties and add it.'
    );
  }

  return secret.trim();
}

function normalizeHeader_(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findHeaderIndex_(headers, aliases) {
  const normalized = headers.map(normalizeHeader_);

  for (const alias of aliases) {
    const target = normalizeHeader_(alias);
    const index = normalized.indexOf(target);
    if (index !== -1) return index;
  }

  return -1;
}

function getSourceHeaderIndexes_(headers) {
  return {
    projectId: findHeaderIndex_(headers, [
      'Project_ID',
      'Project ID',
      'ProjectID',
      'ID',
      'Project Code'
    ]),

    project: findHeaderIndex_(headers, [
      'Project_Name',
      'Project Name',
      'Project',
      'Project Title'
    ]),

    client: findHeaderIndex_(headers, [
      'Client',
      'Client Name',
      'Company',
      'Company Name'
    ]),

    sales: findHeaderIndex_(headers, [
      'Sales_Person',
      'Sales Person',
      'Sales Name',
      'Salesperson',
      'Sales'
    ]),

    sourceCase: findHeaderIndex_(headers, [
      'Source_Case',
      'Source Case',
      'Case',
      'Project Case'
    ]),

    offerSent: findHeaderIndex_(headers, [
      'Offer_Sent',
      'Offer Sent',
      'Offer Sent?',
      'Offer'
    ])
  };
}

function toBoolean_(value) {
  if (typeof value === 'boolean') return value;

  const text = String(value ?? '').trim().toLowerCase();

  if (!text) return false;

  return [
    'true',
    'yes',
    'y',
    '1',
    'sent',
    'offer sent',
    'done',
    'تم',
    'نعم'
  ].includes(text);
}

function pushSourceProjectsToNexus() {
  const sourceSS = SpreadsheetApp.openById(NEXUS_SOURCE_SPREADSHEET_ID);
  const sourceSh = sourceSS.getSheetById(NEXUS_SOURCE_SHEET_ID);

  if (!sourceSh) {
    throw new Error(
      'Source sheet/tab with gid ' +
      NEXUS_SOURCE_SHEET_ID +
      ' was not found.'
    );
  }

  const values = sourceSh.getDataRange().getValues();

  if (values.length < 2) {
    console.log('NEXUS source sync: no project rows found.');
    return { ok: true, received: 0, added: 0, updated: 0, skipped: 0 };
  }

  const headers = values[0].map(h => String(h).trim());
  const idx = getSourceHeaderIndexes_(headers);

  const required = ['sales', 'projectId', 'project', 'client'];
  const missing = required.filter(key => idx[key] === -1);

  if (missing.length) {
    throw new Error(
      'Missing source columns: ' +
      missing.join(', ') +
      '. Headers found: ' +
      headers.join(' | ')
    );
  }

  const projects = [];
  let skipped = 0;

  values.slice(1).forEach(row => {
    const projectId = String(row[idx.projectId] ?? '').trim();

    // Rows without Project_ID cannot be synchronized safely.
    if (!projectId) {
      skipped++;
      return;
    }

    const projectName = String(row[idx.project] ?? '').trim();
    const client = String(row[idx.client] ?? '').trim();
    const salesPerson = String(row[idx.sales] ?? '').trim();

    const sourceCase =
      idx.sourceCase === -1
        ? ''
        : String(row[idx.sourceCase] ?? '').trim();

    let offerSent = false;

    if (idx.offerSent !== -1) {
      offerSent = toBoolean_(row[idx.offerSent]);
    } else {
      offerSent = /offer\s*sent/i.test(sourceCase);
    }

    projects.push({
      Project_ID: projectId,
      Project_Name: projectName,
      Client: client,
      Source_Case: sourceCase,

      // Keep the source value exactly as the source indicates.
      Offer_Sent: offerSent,

      // IMPORTANT:
      // If the source cell is blank, this remains ''.
      // It is never replaced by W. Mahmoudi or another user.
      Sales_Person: salesPerson
    });
  });

  const response = UrlFetchApp.fetch(NEXUS_SUPABASE_SYNC_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-source-sync-secret': getNexusSyncSecret_()
    },
    payload: JSON.stringify({ projects }),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('NEXUS sync failed (' + code + '): ' + body);
  }

  console.log(
    'NEXUS source sync: received=' +
      projects.length +
      ', skipped=' +
      skipped +
      ', response=' +
      body
  );

  const result = JSON.parse(body);
  result.skipped = skipped;
  return result;
}

/**
 * Run once after NEXUS_SUPABASE_SYNC_SECRET has been added.
 * Removes duplicate NEXUS triggers, creates one 15-minute trigger,
 * and immediately performs the first full sync.
 */
function installNexusSourceSync() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'pushSourceProjectsToNexus')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('pushSourceProjectsToNexus')
    .timeBased()
    .everyMinutes(15)
    .create();

  return pushSourceProjectsToNexus();
}

/**
 * Optional: stop automatic NEXUS source synchronization.
 */
function removeNexusSourceSync() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'pushSourceProjectsToNexus')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

/**
 * Optional manual test.
 * Run this before installing the trigger if you want to verify that
 * the source can be read and pushed successfully.
 */
function testNexusSourceSync() {
  return pushSourceProjectsToNexus();
}
