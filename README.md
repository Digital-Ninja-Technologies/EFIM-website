# The Evangel Faith Mission website

Two static sites in one repository, each its own Vercel project:

| Site | Folder | Vercel root directory |
|------|--------|-----------------------|
| Main church site | `/` (repo root) | `.` |
| 2026 National Convention | `convention/` | `convention` |

The main project also ends up serving a copy of `convention/` at `/convention/`; `vercel.json` marks it `noindex` so search engines only list the convention project's own address.
The two sites link to each other with absolute URLs (search for `efim-website.vercel.app` and `efim-convention-peach.vercel.app` if either address changes).

Shared files that both sites use (`logo.webp`, `js/three.min.js`, `js/logo3d.js`, `js/giant-dock.js`) are copied into `convention/`; update both copies when you change them.

## Convention registration (Google Form)
The Register buttons on the convention site open a modal that embeds a Google Form. Paste the form's link into `window.REGISTRATION_FORM_URL` (search for it in `convention/index.html`).
Responses can be sent to a Google Sheet from the form's Responses tab, and that sheet downloads as Excel (.xlsx).
