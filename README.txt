ABAROX Navigation Stability Update

Files:
- index.html
- style.css
- script.js
- supabase-config.js (unchanged; included for a complete code bundle)

Apply only to the supabase-auth-test branch. Do not update main.

Changes:
- Removed the "Aman Bareth" label beside the ABAROX brand in the top bar.
- Removed the Account & Security contact-details section from Profile Settings.
- Kept the bottom navigation outside the scrolling <main> element.
- Consolidated duplicate mobile navigation CSS into one fixed bottom-dock rule.
- Prevented Android VisualViewport scroll updates from resizing/repositioning ordinary sections; chat retains its keyboard viewport handling.

Assets are intentionally excluded. Existing GitHub assets must remain untouched.
