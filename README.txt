YUNEX CHAT UPDATE — GALLERY + MESSAGE ANIMATION FIX

Files: index.html, style.css, script.js, assets/chat-animations/kiss-3d-transparent.gif

Changes in this package:
- Removes the standalone ✦ effects picker from the message composer. Effects are triggered by message text.
- Restores a Gallery button in the composer for selecting image/video files and previewing/removing them before local demo send.
- Places the animation container inside the scrollable chat message area. It takes its own space and does not float over existing messages, header, composer, or keyboard.
- Uses the supplied transparent 3D couple GIF for the Kiss effect (2 seconds). Other effects currently use CSS cartoon-style scenes; matching bespoke 3D animated assets for all five are not included in this package.
- Keeps the dedicated Hug button separate.

IMPORTANT: This is a frontend/local-demo update. Gallery media and messages are not delivered to another account until Supabase Storage and messaging are connected. Back up the current repository before replacing these four paths. Upload the assets folder too; do not upload only the three code files.
