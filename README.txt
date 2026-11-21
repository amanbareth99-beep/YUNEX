YUNEX updated front-end prototype package

Included in this update:
- Registration form fields: 10-digit mobile, password, confirm password, username, private Male/Female selection, Celebrity request checkbox.
- Client-side validation and separate password visibility toggles. Password/mobile are not persisted.
- Celebrity request preview is stored locally on this browser only; there is no real Admin notification or approval backend.
- Chat reaction tray: Kiss, Love You, Miss You, Laugh, Cry and Horror animated reaction previews.
- Hug request/accept preview and gender-based illustrative pairing. The sample chat recipient has demo gender data only.
- Existing YUNEX prototype features and Founder profile/crown files retained.

IMPORTANT: This is still a local front-end prototype. Supabase Auth, database, realtime presence/typing, cross-device chat, actual request notifications, secure private gender storage, Admin approval and production animated character assets are NOT connected. Do not deploy as a live registration system or enter real credentials until backend security is implemented.

Upload index.html, style.css, script.js, README.txt and assets/ to the repository root only after reviewing and approving the changes.


Founder Account Settings preview (this update):
- Founder profile settings now show the supplied 10-digit mobile number and Gmail address.
- Contact fields can be edited and saved locally in this browser preview only.
- New-password fields validate matching values but intentionally do not save or change any password.
- Supabase Auth is not connected in this ZIP, so this does NOT create a real Founder login or change real account credentials.
- Founder username @amanbareth and Founder Gold Crown remain unchanged.
- Do not deploy as a production authentication system until Supabase Auth, secure server-side Founder role assignment, and verified contact-change flows are implemented.
