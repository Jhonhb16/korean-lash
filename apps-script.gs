/**
 * ============================================================
 *  METODO LASH MASTERY — Lead Capture Backend
 *  Google Apps Script Web App · Google Sheets
 * ============================================================
 *
 *  SETUP (one-time):
 *  1. Open your Google Sheet.
 *  2. Extensions → Apps Script.
 *  3. Replace all the code with this file's contents.
 *  4. Replace SHEET_NAME below with the tab name in your sheet.
 *  5. Run setupSheet() ONCE to create the header row.
 *  6. Deploy → New deployment → Web app
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Copy the deployment URL and paste it into script.js (CONFIG.APPS_SCRIPT_URL).
 * ============================================================
 */

// ⬇️ EDIT THIS: must match the name of the tab in your Google Sheet
const SHEET_NAME = 'Leads';

// Header row — keep in sync with the front-end payload
const HEADERS = [
  'Fecha',
  'Nombre',
  'WhatsApp',
  'Email',
  'SituacionActual',
  'CambioDeseado',
  'InteresPrincipal',
  'BloqueoPrincipal',
  'CuandoComenzar',
  'ExplorandoMotivo',
  'CompromisoEconomico',
  'PrioridadIngresos',
  'Estado',
  'LeadScore',
  'LeadTemperatura',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Content',
  'UTM Term',
];

/**
 * Run this function ONCE to set up the header row.
 * After running, you can deploy as a Web App.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Write headers in row 1
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  // Format the header row
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange
    .setBackground('#B8336A')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Auto-resize columns for readability
  sheet.autoResizeColumns(1, HEADERS.length);

  // Freeze the header row
  sheet.setFrozenRows(1);

  Logger.log('✅ Sheet "' + SHEET_NAME + '" is ready with ' + HEADERS.length + ' columns.');
}

/**
 * Handle POST requests from the quiz front-end.
 * Apps Script receives the JSON body in e.postData.contents.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _jsonResponse({ ok: false, error: 'Empty body' }, 400);
    }

    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return _jsonResponse({ ok: false, error: 'Sheet not found: ' + SHEET_NAME }, 500);
    }

    const row = [
      data.fecha || new Date().toISOString(),
      data.nombre || '',
      data.whatsapp || '',
      data.email || '',
      data.situacion_actual || '',
      data.cambio_deseado || '',
      data.interes_principal || '',
      data.bloqueo_principal || '',
      data.cuando_comenzar || '',
      data.explorando_motivo || '',
      data.compromiso_economico || '',
      data.prioridad_ingresos || '',
      data.estado || '',
      data.lead_score || 0,
      data.lead_temperatura || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.utm_content || '',
      data.utm_term || '',
    ];

    sheet.appendRow(row);

    return _jsonResponse({ ok: true, row: sheet.getLastRow() }, 200);
  } catch (err) {
    return _jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

/**
 * Optional: simple GET handler for sanity-checking the deployment.
 * Visit the deployed URL in your browser to see a friendly response.
 */
function doGet() {
  return _jsonResponse(
    {
      ok: true,
      message: 'Método Lash Mastery lead capture endpoint is live.',
      method: 'POST',
      accept: 'application/json',
    },
    200
  );
}

function _jsonResponse(payload, status) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
