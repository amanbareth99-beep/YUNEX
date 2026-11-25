ABAROX — Connect. Create. Win.
Official brand refresh package

Brand identity applied:
- Brand name: ABAROX
- Tagline: Connect. Create. Win.
- Identity: Social Media & Competition Platform
- Visual identity: supplied crown + stylized A + blue orbit symbol
- Palette retained/refined around black, electric blue and white
- Supplied ABAROX launch poster is used on the guest-only welcome panel.

Included files:
- index.html, style.css, script.js, supabase-config.js
- assets/branding/abarox-launch-poster.png (the supplied poster artwork)
- assets/branding/abarox-symbol.jpg (crop of the supplied original logo symbol)
- assets/chat-animations/ (existing animation asset retained)

Careful compatibility decisions:
- Visible website branding and user-facing messages are updated to ABAROX.
- Existing JavaScript element IDs, Supabase browser config variable names, localStorage keys, database table/column names, trigger/function names and Auth UUIDs are intentionally preserved. They are connected to the live Supabase setup; renaming them blindly could break login, profile loading, saved settings or account relationships.
- The database still owns the existing yunex_id field and currently generated YNX- identifiers. This package does NOT migrate IDs to ABX-. That requires a separate dependency review and coordinated SQL migration.
- The current GitHub Pages path /YUNEX/ and the confirmation redirect are intentionally unchanged. Do not rename the repository or URL until the new deployment is tested and Supabase URL Configuration is updated in a coordinated step.
- Supabase project URL and publishable key are retained as supplied. No service_role key is included.
- Founder Auth UUID, Founder role and existing account data are not changed.

Before deployment:
1. Keep a backup of the current deployed source.
2. Upload the contents of this ZIP to the existing repository root, preserving the assets/ folder structure.
3. Test guest welcome poster, registration, confirmation link, login, Founder profile, second-user profile, Explore username search, chat and mobile navigation.
4. Do not rename database identifiers or migrate YNX- IDs as part of this front-end branding upload.

Known project limitations from the existing prototype are unchanged: some social, realtime, privacy and competition functions still need backend implementation and policy review before production use.
