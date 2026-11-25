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


Supabase Authentication integration package:
- Added Supabase JS v2 browser client and supabase-config.js using the project's URL and publishable key.
- Registration now uses Email + Password and retains Full Name, Mobile Number, Username, private gender choice, and Celebrity request UI.
- Login uses Email + Password; password reset email and authenticated password update are wired.
- The client never creates or overwrites yunex_id or user_roles. Existing database triggers remain the source of YUNEX ID and role assignment.
- Profile full_name/username and private_details.phone_number are updated only for an authenticated session, using the existing user row.
- If Email Confirmation is enabled, signup may require email confirmation before the first login.
- Phone OTP remains deferred; Phone Provider must stay disabled.
- Private gender is intentionally not sent to public profile metadata. The existing browser-local preference remains a preview only until a verified private database column/policy is confirmed.
- Celebrity request is sent as auth user metadata only; a real Admin queue/notification backend is not part of this auth patch.
- Test with a non-Founder account first. Do not test Founder password change unless signed in as Founder.
- Keep the publishable key client-side only; never add service_role or secret keys to the website.

Profile/search/confirmation redirect patch (25 Nov 2026):
- Current account profile now loads public full_name, username and yunex_id from the authenticated user's own profiles row (filtered by auth user UUID).
- Founder crown/edit/settings controls are shown only for the configured Founder Auth UUID. Non-Founder accounts no longer inherit the Founder name, handle, bio, badge or Founder local photo.
- Profile logout is available directly on the Profile screen for every signed-in account.
- Explore username search queries only full_name, username and yunex_id from public profiles; it does not request email, phone or private details.
- Signup confirmation redirect now resolves to the current GitHub Pages project root, preserving /YUNEX/ when deployed at https://amanbareth99-beep.github.io/YUNEX/.

Supabase dashboard action still required for confirmation links:
Add https://amanbareth99-beep.github.io/YUNEX/ to Authentication > URL Configuration > Redirect URLs (and keep the Site URL set appropriately). This file cannot change the Supabase dashboard allowlist. Public username search also requires an appropriate SELECT policy on profiles that exposes only intended public profile fields; if RLS denies the query, the UI will show a search/RLS message. Review the policy before launch.
