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


FOUNDER FULL-SCREEN ACCOUNT UPDATE
- Founder profile opens as a full-screen mobile account page. Global top bar, main tabs and footer are hidden while this page is open.
- The branded YUNEX cover sits behind the profile; only part is shown at first. Swipe down on the cover to expand it, swipe up to collapse it. Tap/keyboard activate also toggles.
- Gold YUNEX FOUNDER badge is unchanged.
- Other user/demo profile design is not changed by this update.
- This remains a frontend preview. Founder authentication, permissions, profile data sync and real uploaded cover-photo storage require the secure backend.


FOUNDER PROFILE REFINEMENT (2026-11-19)
- Removed the in-page Home button from the Founder account. Use the Android/browser Back button to return to the previous YUNEX screen.
- Added a Profile heading above the cover.
- Added a soft dark shadow behind the profile panel while the cover is tucked; the shadow fades away when the cover is expanded.
- Other user profile design is unchanged.


FOUNDER CLEAN COVER UPDATE:
- Removed the Profile heading above the cover.
- Removed YUNEX / CONNECT. CREATE. WIN. branding and OFFICIAL FOUNDER text from the cover.
- Kept the profile photo overlapping the cover and retained the separate gold YUNEX FOUNDER badge under the username.
- Replaced the swipe instruction text with a small down-arrow only.
- Preserved cover expand/collapse behavior and the existing mobile back handling.


FOUNDER PROFILE UPDATE: The cover/banner feature, cover photo upload, cover text editor, and swipe-to-expand behavior have been removed. Founder profile now starts directly with the profile photo.
