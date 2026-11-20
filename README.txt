YUNEX FRONT-END PROTOTYPE (DEMO ONLY)

Files:
- index.html
- style.css
- script.js
- README.txt

2026-11-16 Mobile correction:
- Chat header remains fixed and only the message list scrolls.
- Composer is held at the bottom of the visible mobile viewport; the Android keyboard viewport resize is handled through VisualViewport.
- Composer uses a compact fixed-height row without extra bottom safe-area padding that could leave a gap.
- Hug icon is a custom two-person embrace with a small electric-blue heart, white outline, and no emoji glyph.
- Hug and Games controls remain side-by-side.
- Legacy visible Back controls are removed from active section views; device/browser Back navigation remains.
- Full-screen sections hide global navigation and footer.

Important limitations:
- This is still a local front-end demo. Authentication, database, real-time cross-device messages, delivery receipts, Virtual Hug requests, and synchronized multiplayer games require secure Supabase integration.
- Do not enter real passwords or private information in this prototype.
- Never put a Supabase service_role key in frontend files.


2026-11-16 Chat presence update:
- The chat partner status is shown under their name in the fixed header.
- The local demo switches Online -> Typing... while a simulated reply is pending, then returns to Online.
- The separate typing bubble has been removed from the message list.
- Presence is a local preview only; real online presence and remote typing require Supabase Realtime.
