/**
 * EMDAD NEXUS - Google Sheets -> Supabase source sync
 *
 * Add this file to the EXISTING Apps Script project attached to the
 * CRM source Google Sheet.
 *
 * One-time setup:
 *   1) Add Script Property: NEXUS_SUPABASE_SYNC_SECRET
 *   2) Run installNexusSourceSync()
 *
 * The trigger then runs every 15 minutes.
 *
 * Source-owned fields only:
 *   Project_ID, Project_Name, Client, Source_Case, Offer_Sent, Sales_Person
 *
 * CRM-owned fields are NOT overwritten:
 *   Current_Action, Estimated_Value, Follow Ups, Contracts, Collections,
 *   Notes, Lost Reason, etc.
 */

const NEXUS_SUPABASE_SYNC_URL =
  'https://mlqujqoxedosqbmlecwf.supabase.co/functions/v1/sync-source-projects';

function getNexusSyncSecret_() {
  const secret = PropertiesService.getScriptProperties()
    .getProperty('NEXUS_SUPABASE_SYNC_SECRET');

  if (!secret) {
    throw new Error(
      'Missing Script Property: NEXUS_SUPABASE_SYNC_SECRET. ' +
      'Open Project Settings > Script Properties and add it.'
    );
  }

  return secret.trim();
}

function pushSourceProjectsToNexus() {
  const sourceSS = SpreadsheetApp.openById(CONFIG.SOURCE_SPREADSHEET_ID);
  const sourceSh = sourceSS.getSheetById(CONFIG.SOURCE_SHEET_ID);

  if (!sourceSh) {
    throw new Error(
      'Source sheet/tab with gid ' + CONFIG.SOURCE_SHEET_ID + ' was not found.'
    );
  }

  const values = sourceSh.getDataRange().getValues();

  if (values.length < 2) {
    console.log('NEXUS source sync: no project rows found.');
    return { ok: true, received: 0, added: 0, updated: 0 };
  }

  const headers = values[0].map(h => String(h).trim());
  const idx = headerIndexes_(headers);

  const required = ['sales', 'projectId', 'project', 'client', 'case'];
  const missing = required.filter(k => idx[k] === -1);

  if (missing.length) {
    throw new Error('Missing source columns: ' + missing.join(', '));
  }

  const projects = values.slice(1)
    .map(row => ({
      Project_ID: String(row[idx.projectId] ?? '').trim(),
      Project_Name: String(row[idx.project] ?? '').trim(),
      Client: String(row[idx.client] ?? '').trim(),
      Source_Case: String(row[idx.case] ?? '').trim(),
      Offer_Sent: /offer\s*sent/i.test(String(row[idx.case] ?? '')),
      // IMPORTANT:
      // Blank Sales Person stays blank. Never auto-assign the logged-in user.
      Sales_Person: String(row[idx.sales] ?? '').trim()
    }))
    .filter(p => p.Project_ID);

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

  console.log('NEXUS source sync: ' + body);
  return JSON.parse(body);
}

/**
 * One-time setup.
 * Removes duplicate NEXUS sync triggers, creates one 15-minute trigger,
 * then performs the first full sync immediately.
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
 * Optional: stop automatic NEXUS source sync.
 */
function removeNexusSourceSync() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'pushSourceProjectsToNexus')
    .forEach(t => ScriptApp.deleteTrigger(t));
}
