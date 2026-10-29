/**
 * The Evangel Faith Mission 2026 National Convention: registration receiver.
 * Deploy as a web app (Execute as: Me, Who has access: Anyone) and put the /exec URL in the
 * Vercel env var SHEET_WEBHOOK_URL. Set a Script Property SECRET and use the same value in
 * SHEET_WEBHOOK_SECRET so only the website can add rows.
 * The first registration creates the spreadsheet "The Evangel Faith Mission 2026 Convention Registrations" in the
 * deploying Google account's Drive. Open it, or use File > Download > Microsoft Excel (.xlsx).
 */
var SHEET_TITLE = 'The Evangel Faith Mission 2026 Convention Registrations';
var HEADERS = ['Received', 'Reference', 'Name', 'Phone', 'Email', 'Branch', 'Days', 'People', 'First time'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (secret && body.secret !== secret) return out_({ ok: false, error: 'forbidden' });
    var sh = sheet_();
    sh.appendRow([new Date(), body.ref, body.name, body.phone, body.email, body.branch, body.days, body.people, body.firstTime]);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return out_({ ok: true, service: 'evangel-faith-mission-convention-registrations' });
}

function sheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : null;
  if (!ss) {
    ss = SpreadsheetApp.create(SHEET_TITLE);
    props.setProperty('SHEET_ID', ss.getId());
    var first = ss.getSheets()[0];
    first.setName('Registrations');
    first.appendRow(HEADERS);
    first.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    first.setFrozenRows(1);
  }
  return ss.getSheets()[0];
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
