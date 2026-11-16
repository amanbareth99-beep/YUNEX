YUNEX — Connect. Create. Win.

CONSOLIDATED MOBILE UI UPDATE
Files: index.html, style.css, script.js, README.txt

What changed in this update:
- Chat is a dedicated full-screen view. The global site header, main tabs and footer are hidden while Chat is open.
- Compact chat profile/name header stays at the top while only the message list scrolls.
- Hug and Games controls sit side-by-side in the header.
- Hug control uses a custom inline SVG people-and-heart symbol in YUNEX blue styling; the tap target remains 42px.
- Message composer stays at the bottom of the chat viewport and accounts for mobile safe-area insets.
- The visible Chat back button was removed. Browser/Android Back uses the existing in-site history navigation.
- Registration is a dedicated full-screen view. Its visible Back to Home button was removed; browser/Android Back uses in-site history navigation.
- Home welcome poster remains inside the Home Feed only and is not part of Registration.
- The only two chat game choices are Tic-Tac-Toe and Word Game. Local preview controls are included.

IMPORTANT FUNCTIONALITY LIMITS
This repository is still a front-end prototype. It is not connected to Supabase or another backend.
- Registration/login does not create a real account. Do not enter a real password.
- Chat messages, Sent/Delivered/Seen indicators, typing, Hug, game invitations, game acceptance/decline, and game turns are local previews on this device only.
- Real multi-user chat, invitation delivery, shared Tic-Tac-Toe/Word Game sessions, persistent accounts, and secure authentication require backend integration and security testing.

DEPLOYMENT
Replace the repository's existing index.html, style.css, script.js and README.txt with these four files, keeping them in the repository root (not inside an extra nested folder). Then commit the changes and allow GitHub Pages to redeploy.
