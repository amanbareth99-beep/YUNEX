YUNEX FRONT-END PROTOTYPE (DEMO ONLY)

Files:
- index.html
- style.css
- script.js

How to test:
1. Extract this ZIP.
2. Open index.html in a browser, or upload all three files to a separate YUNEX GitHub repository.
3. Test the Home, Explore, Create, Compete, Profile and Create Account screens on mobile.

Important limitations:
- This is a visual/front-end prototype, not a production social network.
- Login/registration, permanent YUNEX IDs, database, real uploads, chat, notifications, admin permissions, and competition payments are NOT connected yet.
- Upload selection only previews a file locally in your browser.
- Demo profile/feed data is sample content.
- Do not enter real passwords or personal information.
- Competition controls (fees, opening/last-entry/end dates, prize, rules and status) are planned for the secure backend-powered Admin Panel, not implemented in this front-end demo.

Next development phase:
Connect Firebase Authentication and Firestore, then implement secure user records and role-based Founder/Admin access. Never place admin secrets in front-end JavaScript.


Update (2026-11-13):
- Main navigation and top header are hidden while a dedicated section is open.
- Each non-home section receives a Back control; browser/Android Back remains supported.
- Chat remains a local demo in this build. Supabase URL + publishable/anon key and a real authenticated account flow are required before live messaging can be enabled.
- Never place a Supabase service_role key in frontend files.
