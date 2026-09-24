/**
 * EMDAD NEXUS - Google Sheets -> Supabase source sync
 *
 * Paste into the existing CRM Apps Script project (Code(6).gs).
 * Run installNexusSourceSync() ONCE and approve the permissions.
 *
 * This sync is intentionally SOURCE-OWNED only:
 * Project_ID, Project_Name, Client, Source_Case, Offer_Sent, Sales_Person.
 * It never overwrites CRM-owned fields such as stage, value, follow-ups,
 * contracts, collections, notes, etc.
 */

const NEXUS_SUPABASE_SYNC_URL =
  'https://mlqujqoxedosqbmlecwf.supabase.co/functions/v1/sync-source-projects';

const NEXUS_SOURCE_SYNC_SECRET =
  'PASTE_THE_SYNC_SECRET_HERE';

function pushSourceProjectsToNexus() {
  const sourceSS = SpreadsheetApp.openById(CONFIG.SOURCE_SPREADSHEET_ID);
  const sourceSh = sourceSS.getSheetById(CONFIG.SOURCE_SHEET_ID);
  if (!sourceSh) {
    throw new Error('Source sheet/tab with gid ' + CONFIG.SOURCE_SHEET_ID + ' was not found.');
  }

  const values = sourceSh.getDataRange().getValues();
  if (values.length < 2) {
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
      Sales_Person: String(row[idx.sales] ?? '').trim()
    }))
    .filter(p => p.Project_ID);

  const response = UrlFetchApp.fetch(NEXUS_SUPABASE_SYNC_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-source-sync-secret': NEXUS_SOURCE_SYNC_SECRET
    },
    payload: JSON.stringify({ projects }),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('NEXUS sync failed (' + code + '): ' + body);
  }

  console.log(body);
  return JSON.parse(body);
}

function installNexusSourceSync() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'pushSourceProjectsToNexus')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('pushSourceProjectsToNexus')
    .timeBased()
    .everyMinutes(15)
    .create();

  // Initial sync immediately after installation.
  return pushSourceProjectsToNexus();
}

function removeNexusSourceSync() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'pushSourceProjectsToNexus')
    .forEach(t => ScriptApp.deleteTrigger(t));
}
