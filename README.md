# EFIM-website
Church website (static site on Vercel).

## Convention registrations to a spreadsheet
`/api/register` (see `api/register.js`) forwards each registration to a Google Sheet through a small Apps Script web app.

1. Go to https://script.google.com, create a project and paste in `google-apps-script/Code.gs`.
2. Project Settings > Script Properties: add `SECRET` with a long random value.
3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the `/exec` URL.
4. In Vercel (Project > Settings > Environment Variables) add `SHEET_WEBHOOK_URL` (the `/exec` URL) and `SHEET_WEBHOOK_SECRET` (same value as `SECRET`), then redeploy.

The first registration creates the sheet "TEFIM 2026 Convention Registrations". Open it in Google Sheets, or use File > Download > Microsoft Excel (.xlsx).
