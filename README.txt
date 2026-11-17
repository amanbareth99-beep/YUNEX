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

2026-11-16 Chat deletion controls:
- Chat header overflow menu includes Clear chat and Delete chat.
- Tap a message to open Delete for me / Delete for everyone / Cancel actions.
- Destructive actions ask for confirmation.
- This front-end demo only changes the local preview. True Delete for everyone across devices,
  message retention, and conversation deletion require authenticated Supabase backend policies.


YUNEX Chat Animations + Delete Icon Update
- Replaces the whole-chat three-dot menu trigger with a clear trash/delete icon.
- The trash icon still opens Clear chat and Delete chat actions with confirmations.
- Preserves message-level Delete for me / Delete for everyone actions.
- Adds a compact effects picker: Hug, Kiss, Love You, Miss You, Laugh, Cry and Horror.
- Reuses the header Hug control to play the subtle Hug effect.
- Effects are low-light, moderate-size, non-flashing and fade out smoothly.
- Respects the device reduced-motion preference.
- Front-end demo only: sending effects to the other participant requires Supabase realtime/backend integration.
- Existing chat presence and delete-option demo changes are retained.


YUNEX Chat UI + Keyboard Follow-up Fix
- Moves the chat effects tray into an anchored overlay directly above the message composer.
- Prevents the effects tray and animation layer from creating extra CSS grid rows that can place controls in the wrong area.
- After sending a message, restores focus to the message input so the Android keyboard remains available for the next message.
- Adds enterkeyhint=send for a more suitable mobile keyboard action.
- Retains chat animations, trash/delete icon, Clear Chat/Delete Chat, message deletion options, and existing presence demo.
- Keyboard behavior should be tested on the target Android browser; device/browser focus policies can vary.
