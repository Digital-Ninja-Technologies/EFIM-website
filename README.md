# The Evangel Faith Mission website

Two static sites in one repository, each its own Vercel project:

| Site | Folder | Vercel root directory |
|------|--------|-----------------------|
| Main church site | `/` (repo root) | `.` |
| 2026 National Convention | `convention/` | `convention` |

The main project also ends up serving a copy of `convention/` at `/convention/`; `vercel.json` marks it `noindex` so search engines only list the convention project's own address.
The two sites link to each other with absolute URLs (search for `efim-website.vercel.app` and `efim-convention-peach.vercel.app` if either address changes).

Shared files that both sites use (`logo.webp`, `js/three.min.js`, `js/logo3d.js`, `js/giant-dock.js`) are copied into `convention/`; update both copies when you change them.

## Convention registrations to a spreadsheet
The convention site's `/api/register` (see `convention/api/register.js`) forwards each registration to a Google Sheet through a small Apps Script web app.

1. Go to https://script.google.com, create a project and paste in `convention/google-apps-script/Code.gs`.
2. Project Settings > Script Properties: add `SECRET` with a long random value.
3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the `/exec` URL.
4. In Vercel, open the **convention** project > Settings > Environment Variables and add `SHEET_WEBHOOK_URL` (the `/exec` URL) and `SHEET_WEBHOOK_SECRET` (same value as `SECRET`), then redeploy.

The first registration creates the sheet "The Evangel Faith Mission 2026 Convention Registrations". Open it in Google Sheets, or use File > Download > Microsoft Excel (.xlsx).
