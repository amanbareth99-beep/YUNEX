YUNEX FOUNDER PROFILE UPDATE — FRONT-END PREVIEW

Files:
- index.html
- style.css
- script.js

Founder profile additions:
- Premium dark / electric-blue Founder cover and identity styling
- Aman Bareth / @amanbareth starter display
- Founder badge and Founder label
- Profile photo selection with local browser preview
- Edit profile: name, username, and bio
- Local browser persistence for editable profile details and photo
- Posts / Reels / Tagged empty-state tabs
- Share profile action (native share sheet or copy fallback)
- YUNEX ID intentionally shown as pending secure account setup; no fake ID is generated

Important limitations:
- This is a front-end demo. Profile edits and photo are stored only in this browser using local storage.
- No real user authentication, permanent YUNEX ID assignment, follower/post counts, profile database sync, or server-side Founder authorization is implemented.
- Founder status and permissions must be verified by the secure backend before launch.
- Do not enter real passwords or private information in this prototype.
- Never put a Supabase service_role key in frontend files.

Deployment:
Upload index.html, style.css, and script.js to the repository root, replacing the matching files. index.html loads script.js (not script.txt).
