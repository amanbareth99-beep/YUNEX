(() => {
  'use strict';

  const views = Array.from(document.querySelectorAll('.view'));
  const tabs = document.querySelector('.tabs');
  // Keep the primary dock outside the scrolling <main> tree so mobile scroll
  // containers/containing blocks cannot move it with feed content.
  if (tabs && tabs.parentElement !== document.body) document.body.appendChild(tabs);

  // Bottom navigation uses a fixed layout-viewport anchor. Do not recalculate
  // its bottom offset on VisualViewport scroll/touch events; Android Chrome can
  // report transient offsetTop changes that make a dock visibly jump.

  let currentView = 'feed';
  let currentProfileAuthUser = null;
  let activeDemoUser = { name: 'Riya Creates', handle: '@riya_demo' };
  let exitWarningAt = 0;
  let chatKeyboardHistoryEntry = false;

  // One avatar renderer is shared by every place a profile appears.
  function profilePhotoKey(key) { return key === 'founder' ? 'yunexFounderPhoto' : `yunexProfilePhoto:${key.replace(/^user:/, '')}`; }
  function renderProfileAvatar(element, key, fallbackText) {
    if (!element || !key) return;
    // A Supabase-backed avatar is authoritative across browsers. Do not replace
    // or remove it during later localStorage-only avatar refreshes.
    if (element.dataset.remoteAvatar === 'true') return;
    let photo = '';
    try { photo = localStorage.getItem(profilePhotoKey(key)) || (key === 'founder' ? localStorage.getItem('yunexFounderPhoto') : ''); } catch (_) {}
    element.classList.add('has-profile-photo');
    let img = element.querySelector(':scope > img.profile-avatar-image');
    if (photo) {
      if (!img) { element.textContent = ''; img = document.createElement('img'); img.className = 'profile-avatar-image'; img.alt = 'Profile photo'; element.appendChild(img); }
      if (img.src !== photo) img.src = photo;
      element.setAttribute('data-photo-loaded', 'true');
    } else {
      if (img) img.remove();
      if (fallbackText && !element.textContent.trim()) element.textContent = fallbackText;
      element.removeAttribute('data-photo-loaded');
    }
  }
  function refreshAllProfileAvatars() {
    document.querySelectorAll('[data-profile-avatar]').forEach(el => {
      const key = el.dataset.profileAvatar;
      const fallback = el.dataset.user ? el.dataset.user.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase() : (key === 'founder' ? 'AB' : (el.textContent || '?'));
      renderProfileAvatar(el, key, fallback);
    });
  }
  refreshAllProfileAvatars();

  function renderView(id) {
    if (!document.getElementById(id)) id = 'feed';
    currentView = id;
    if (id !== 'chat') chatKeyboardHistoryEntry = false;
    views.forEach(view => view.classList.toggle('active', view.id === id));
    document.querySelectorAll('.tab[data-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.view === id);
    });
    if (tabs) tabs.hidden = (id === 'account' || id === 'chat');
    document.body.classList.toggle('section-open', id !== 'feed');
    document.body.classList.toggle('registration-open', id === 'account');
    document.body.classList.toggle('chat-open', id === 'chat');
    document.body.classList.toggle('founder-account-open', id === 'profile');
    document.body.classList.toggle('public-profile-open', id === 'demoProfile');
    const profileView = document.getElementById('profile');
    if (profileView && id !== 'profile') profileView.classList.remove('cover-expanded');
    document.querySelectorAll('main > .view.active .back-home, main > .view.active .back-button, main > .view.active .back-btn, main > .view.active [data-action="back"]').forEach(button => button.remove());
    if (id === 'chat') { syncVisibleViewport(); const box = document.getElementById('chatMessages'); if (box) requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; }); }
    else window.scrollTo(0, 0);
  }

  // Track the actual visible viewport. Android keyboards may resize the
  // layout viewport or overlay it; bottom-gap handles both modes.
  function syncVisibleViewport() {
    const vv = window.visualViewport;
    const height = vv ? vv.height : window.innerHeight;
    const top = vv ? vv.offsetTop : 0;
    const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
    const bottomGap = Math.max(0, layoutHeight - height - top);
    document.documentElement.style.setProperty('--yunex-vv-height', `${Math.max(1, height)}px`);
    document.documentElement.style.setProperty('--yunex-vv-top', `${Math.max(0, top)}px`);
    document.documentElement.style.setProperty('--yunex-vv-bottom-gap', `${bottomGap}px`);
  }
  syncVisibleViewport();
  window.addEventListener('resize', syncVisibleViewport, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(syncVisibleViewport, 80), { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncVisibleViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', syncVisibleViewport, { passive: true });
  }
  const chatInputForViewport = document.getElementById('chatInput');
  if (chatInputForViewport) {
    chatInputForViewport.addEventListener('focus', () => {
      if (!chatKeyboardHistoryEntry && currentView === 'chat') {
        history.pushState({ yunex: true, view: 'chat', keyboardSentinel: true }, '', '#chat');
        chatKeyboardHistoryEntry = true;
      }
      syncVisibleViewport();
      requestAnimationFrame(() => {
        syncVisibleViewport();
        const box = document.getElementById('chatMessages');
        if (box) box.scrollTop = box.scrollHeight;
      });
    });
    chatInputForViewport.addEventListener('blur', () => {
      requestAnimationFrame(syncVisibleViewport);
      window.setTimeout(syncVisibleViewport, 120);
    });
  }

  function navigate(id) {
    if (!document.getElementById(id) || id === currentView) return;
    history.pushState({ yunex: true, view: id }, '', '#' + id);
    renderView(id);
  }


  // Start with a clean Home Feed history entry.
  history.replaceState({ yunex: true, view: 'feed' }, '', location.pathname + location.search);
  renderView('feed');

  // All internal navigation uses one delegated handler, including dynamically shown controls.
  document.addEventListener('click', event => {
    const profileButton = event.target.closest('.profile-open');
    if (profileButton) {
      activeDemoUser = {
        name: profileButton.dataset.user || 'ABAROX Creator',
        handle: profileButton.dataset.handle || '@creator_demo'
      };
      document.getElementById('demoName').textContent = activeDemoUser.name;
      document.getElementById('demoHandle').textContent = activeDemoUser.handle;
      const avatarKey = `user:${activeDemoUser.handle}`;
      document.getElementById('demoAvatar').dataset.profileAvatar = avatarKey;
      document.getElementById('chatAvatar').dataset.profileAvatar = avatarKey;
      document.getElementById('demoAvatar').textContent = activeDemoUser.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      document.getElementById('chatAvatar').textContent = activeDemoUser.name[0].toUpperCase();
      refreshAllProfileAvatars();
      document.getElementById('chatName').textContent = activeDemoUser.name;
      const follow = document.getElementById('followDemo');
      follow.textContent = 'Follow';
      follow.classList.remove('following');
      navigate('demoProfile');
      return;
    }

    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
      event.preventDefault();
      navigate(viewButton.dataset.view);
      return;
    }

    if (event.target.closest('#profileShortcut')) {
      navigate('profile');
      return;
    }

    if (event.target.closest('.brand')) {
      event.preventDefault();
      navigate('feed');
      return;
    }

    if (event.target.closest('#followDemo')) {
      const button = document.getElementById('followDemo');
      const following = button.classList.toggle('following');
      button.textContent = following ? 'Following' : 'Follow';
      return;
    }

    if (event.target.closest('#messageDemo')) {
      document.getElementById('chatName').textContent = activeDemoUser.name;
      const typingName = document.getElementById('typingName');
      if (typingName) typingName.textContent = activeDemoUser.name.split(/\s+/)[0];
      document.getElementById('chatAvatar').dataset.profileAvatar = `user:${activeDemoUser.handle}`;
      document.getElementById('chatAvatar').textContent = activeDemoUser.name[0].toUpperCase();
      refreshAllProfileAvatars();
      navigate('chat');
      return;
    }

    if (event.target.closest('#hugButton')) {
      const overlay = document.getElementById('hugOverlay');
      document.getElementById('hugRequestText').textContent = `You sent a Hug request to ${activeDemoUser.name}. Accept it in this local preview to see the animation.`;
      document.getElementById('hugPreview').textContent = '🤗';
      overlay.hidden = false; overlay.dataset.direction = 'outgoing'; return;
    }
    if (event.target.closest('#declineHug')) { document.getElementById('hugOverlay').hidden = true; return; }
    if (event.target.closest('#acceptHug')) {
      const overlay = document.getElementById('hugOverlay'); overlay.hidden = true;
      const gender = (() => { try { return JSON.parse(localStorage.getItem('yunexRegistrationPreview') || '{}').gender || 'female'; } catch (_) { return 'female'; } })();
      const otherGender = 'female'; // Demo recipient profile has no verified private gender data.
      const pair = gender === 'male' && otherGender === 'male' ? '👦🏻🤗👦🏽' : gender === 'female' && otherGender === 'female' ? '👧🏻🤗👧🏽' : '👦🏻🤗👧🏻';
      appendAnimatedReaction('hug', 'Hug', pair); return;
    }
    if (event.target.closest('#gamesButton')) { document.getElementById('gamesOverlay').hidden = false; return; }
    if (event.target.closest('#closeGames')) { document.getElementById('gamesOverlay').hidden = true; return; }
    const gameChoice = event.target.closest('.game-choice');
    if (gameChoice) { selectGame(gameChoice.dataset.game); return; }
    if (event.target.closest('#sendGameInvite')) { document.getElementById('gameStatus').textContent = 'Game invitation prepared for ' + activeDemoUser.name + ' · demo only; no notification is sent to another device.'; return; }
    if (event.target.closest('#acceptGameInvite')) { document.getElementById('gameStatus').textContent = 'Invitation accepted in this local preview. Start playing!'; return; }
    if (event.target.closest('#declineGameInvite')) { document.getElementById('gameStatus').textContent = 'Invitation declined in this local preview.'; return; }
    if (event.target.closest('#resetGame')) { resetGames(); return; }
    const cell = event.target.closest('[data-cell]');
    if (cell) { playCell(Number(cell.dataset.cell)); return; }

    const likeButton = event.target.closest('.like-btn');
    if (likeButton) {
      const liked = likeButton.classList.toggle('liked');
      likeButton.firstChild.textContent = liked ? '♥ ' : '♡ ';
      const label = likeButton.querySelector('span');
      if (label) label.textContent = liked ? 'Liked' : 'Like';
    }
  });

  // Android/browser Back: go to the previous YUNEX screen, not out of the site.
  window.addEventListener('popstate', event => {
    if (currentView === 'chat' && chatKeyboardHistoryEntry) {
      chatKeyboardHistoryEntry = false;
      const input = document.getElementById('chatInput');
      if (input) input.blur();
      syncVisibleViewport();
      return;
    }
    if (event.state && event.state.yunex && event.state.view) {
      renderView(event.state.view);
      return;
    }
    if (currentView === 'feed') {
      const now = Date.now();
      if (exitWarningAt && now - exitWarningAt <= 2000) return;
      exitWarningAt = now;
      history.pushState({ yunex: true, view: 'feed' }, '', location.pathname + location.search + '#feed');
      let toast = document.getElementById('exitToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'exitToast';
        toast.className = 'exit-toast';
        toast.textContent = 'Exit ke liye dobara Back dabayein';
        document.body.appendChild(toast);
      }
      toast.classList.add('show');
      window.setTimeout(() => toast.classList.remove('show'), 1800);
    } else {
      renderView('feed');
    }
  });

  const chatInputForFocus = document.getElementById('chatInput');
  if (chatInputForFocus) {
    chatInputForFocus.addEventListener('focus', () => {
      syncVisibleViewport();
      requestAnimationFrame(() => {
        const box = document.getElementById('chatMessages');
        if (box) box.scrollTop = box.scrollHeight;
      });
    });
  }

  const fileInput = document.getElementById('mediaFile');
  if (fileInput) fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    if (!file) return;
    const element = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
    element.src = URL.createObjectURL(file);
    if (element.tagName === 'VIDEO') element.controls = true;
    preview.appendChild(element);
  });

  const demoPost = document.getElementById('demoPost');
  if (demoPost) demoPost.addEventListener('click', () => {
    const message = document.getElementById('uploadMessage');
    message.hidden = false;
    message.textContent = fileInput.files.length
      ? 'Local preview ready. This file has not been uploaded or published.'
      : 'Choose a photo or video first to preview it.';
  });

  // Supabase Authentication integration. Existing non-auth YUNEX features remain unchanged.
  const registrationForm = document.getElementById('yunexRegisterForm');
  const loginForm = document.getElementById('yunexLoginForm');
  const registrationFeedback = document.getElementById('registrationFeedback');
  const loginFeedback = document.getElementById('loginFeedback');
  const registerModeButton = document.getElementById('showRegisterMode');
  const loginModeButton = document.getElementById('showLoginMode');
  const authSessionPanel = document.getElementById('authSessionPanel');
  const authSessionText = document.getElementById('authSessionText');
  let yunexSupabase = null;
  let authActionBusy = false;

  try {
    if (window.supabase?.createClient && window.YUNEX_SUPABASE_URL && window.YUNEX_SUPABASE_PUBLISHABLE_KEY) {
      yunexSupabase = window.supabase.createClient(
        window.YUNEX_SUPABASE_URL,
        window.YUNEX_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
      );
    }
  } catch (error) {
    console.error('ABAROX Supabase initialization failed:', error);
  }

  function setAuthFeedback(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('validation-error', !!isError);
  }
  function setAuthMode(mode) {
    const registering = mode === 'register';
    if (registrationForm) registrationForm.hidden = !registering;
    if (loginForm) loginForm.hidden = registering;
    if (registerModeButton) registerModeButton.classList.toggle('active', registering);
    if (loginModeButton) loginModeButton.classList.toggle('active', !registering);
  }
  if (registerModeButton) registerModeButton.addEventListener('click', () => setAuthMode('register'));
  if (loginModeButton) loginModeButton.addEventListener('click', () => setAuthMode('login'));

  document.querySelectorAll('#feed .welcome-actions [data-view="account"]').forEach(button => {
    button.addEventListener('click', () => {
      setAuthMode(button.dataset.authMode === 'login' ? 'login' : 'register');
    });
  });

  document.querySelectorAll('[data-toggle-password]').forEach(button => button.addEventListener('click', () => {
    const field = document.getElementById(button.dataset.togglePassword); if (!field) return;
    field.type = field.type === 'password' ? 'text' : 'password';
    button.setAttribute('aria-label', field.type === 'password' ? 'Show password' : 'Hide password');
    button.textContent = field.type === 'password' ? '◉' : '◎';
  }));

  const mobileField = document.getElementById('regMobile');
  if (mobileField) mobileField.addEventListener('input', () => { mobileField.value = mobileField.value.replace(/\D/g, '').slice(0, 10); });

  async function syncAuthenticatedProfile(user) {
    if (!yunexSupabase || !user?.id) return;
    const meta = user.user_metadata || {};
    const profilePatch = {};
    if (typeof meta.full_name === 'string' && meta.full_name.trim()) profilePatch.full_name = meta.full_name.trim();
    if (typeof meta.username === 'string' && meta.username.trim()) profilePatch.username = meta.username.trim();
    if (Object.keys(profilePatch).length) {
      // Update only known profile columns. Never write yunex_id: the database trigger owns it.
      const { error } = await yunexSupabase.from('profiles').update(profilePatch).eq('id', user.id);
      if (error) console.warn('ABAROX profile sync was not completed:', error.message);
    }
    if (typeof meta.phone_number === 'string' && /^[0-9]{10}$/.test(meta.phone_number)) {
      // user_private_details row is created by the existing database setup; update only its known phone column.
      const { error } = await yunexSupabase.from('user_private_details')
        .update({ phone_number: meta.phone_number }).eq('user_id', user.id);
      if (error) console.warn('ABAROX private phone sync was not completed:', error.message);
    }
  }

  const FOUNDER_AUTH_ID = '84293736-9358-4c8d-ae27-48eda6e4cb1c';

  async function refreshYunexId(user) {
    const idElement = document.getElementById('founderId');
    if (!idElement) return;
    if (!user || !yunexSupabase) { idElement.textContent = 'Login to view your Account ID'; return; }
    idElement.textContent = 'Loading Account ID…';
    try {
      const { data, error } = await yunexSupabase.from('profiles')
        .select('yunex_id').eq('id', user.id).maybeSingle();
      if (error) throw error;
      idElement.textContent = data?.yunex_id || 'Account ID not available yet';
    } catch (error) {
      console.warn('Could not load Account ID:', error.message);
      idElement.textContent = 'Account ID could not be loaded';
    }
  }

  async function loadCurrentAccountProfile(user) {
    currentProfileAuthUser = user || null;
    const nameEl = document.getElementById('founderName');
    const handleEl = document.getElementById('founderHandle');
    const bioEl = document.getElementById('founderBio');
    const founderBadge = document.getElementById('founderCrownBadge');
    const personalFounderBadge = document.getElementById('founderPersonalBadge');
    const verified = document.querySelector('#profile .founder-verified');
    const editButton = document.getElementById('editFounderProfile');
    const photoEdit = document.querySelector('#profile .photo-edit');
    const settingsButton = document.getElementById('founderSettings');
    const photo = document.getElementById('founderPhoto');

    if (!user) {
      if (nameEl) nameEl.textContent = 'Login to view your profile';
      if (handleEl) handleEl.textContent = '';
      if (bioEl) bioEl.textContent = '';
      if (founderBadge) founderBadge.hidden = true;
      if (personalFounderBadge) personalFounderBadge.hidden = true;
      if (verified) verified.hidden = true;
      if (editButton) editButton.hidden = true;
      if (photoEdit) photoEdit.hidden = true;
      if (settingsButton) settingsButton.hidden = true;
      if (photo) { photo.dataset.profileAvatar = ''; photo.textContent = '?'; }
      return;
    }

    const isFounder = user.id === FOUNDER_AUTH_ID;
    const photoKey = isFounder ? 'founder' : `user:${user.id}`;
    if (founderBadge) founderBadge.hidden = !isFounder;
    if (personalFounderBadge) personalFounderBadge.hidden = !isFounder;
    if (verified) verified.hidden = !isFounder;
    if (editButton) editButton.hidden = false;
    if (photoEdit) photoEdit.hidden = false;
    if (settingsButton) settingsButton.hidden = false;

    // Birthday, Special Days, privacy and password settings are common to
    // every account. Only the optional Founder contact preview is restricted.
    const founderOnlyFields = ['founderAccountMobile','founderAccountEmail','saveFounderContact'];
    founderOnlyFields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const target = el.closest('label') || el;
      target.hidden = !isFounder;
    });
    const settingsDialog = document.querySelector('#founderDatesOverlay .founder-edit-dialog');
    if (settingsDialog) settingsDialog.querySelectorAll('h4').forEach(h => {
      if (/Founder contact/i.test(h.textContent)) h.hidden = !isFounder;
    });

    if (photo) {
      photo.dataset.profileAvatar = photoKey;
      photo.dataset.remoteAvatar = 'false';
    }
    if (!yunexSupabase) return;

    try {
      const { data, error } = await yunexSupabase.from('profiles')
        .select('full_name, username, bio, yunex_id, avatar_path')
        .eq('id', user.id).maybeSingle();
      if (error) throw error;

      const fullName = data?.full_name || user.user_metadata?.full_name ||
        (isFounder ? founderDefaults.name : 'ABAROX User');
      const username = data?.username || user.user_metadata?.username ||
        (isFounder ? 'amanbareth' : '');
      const bio = data?.bio || user.user_metadata?.bio ||
        (isFounder ? founderDefaults.bio : 'Welcome to your profile.');

      if (nameEl) nameEl.textContent = fullName;
      if (handleEl) handleEl.textContent = username ? '@' + username.replace(/^@/, '') : '';
      if (bioEl) bioEl.textContent = bio;
      const idEl = document.getElementById('founderId');
      if (idEl) idEl.textContent = data?.yunex_id || 'Account ID not available yet';

      if (photo) {
        const fallback = fullName.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
        photo.textContent = fallback || '?';
        if (data?.avatar_path) {
          const url = /^https?:\/\//i.test(data.avatar_path)
            ? data.avatar_path
            : (yunexSupabase.storage.from('avatars').getPublicUrl(data.avatar_path).data?.publicUrl || '');
          if (url) {
            photo.innerHTML = '';
            const img = document.createElement('img');
            img.className = 'profile-avatar-image';
            img.alt = 'Profile photo';
            img.referrerPolicy = 'no-referrer';
            img.src = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
            photo.appendChild(img);
            photo.dataset.remoteAvatar = 'true';
          }
        } else {
          renderProfileAvatar(photo, photoKey, fallback || '?');
        }
      }
      const title = document.querySelector('#profile .founder-notice');
      if (title) title.hidden = true;
      if (isFounder) {
        founderProfile = { name: fullName, handle: '@' + username.replace(/^@/, ''), bio };
        try { localStorage.setItem('yunexFounderProfile', JSON.stringify(founderProfile)); } catch (_) {}
      }
    } catch (error) {
      console.warn('Could not load this account profile:', error.message);
      if (nameEl) nameEl.textContent = 'Profile could not be loaded';
      if (handleEl) handleEl.textContent = '';
      if (bioEl) bioEl.textContent = 'Check profiles table permissions (RLS) in Supabase.';
    }
  }

  function themeStorageKey(userId) { return `abarox:theme:${userId || 'guest'}`; }
  function applyTheme(theme) {
    const chosen = theme === 'light' ? 'light' : 'dark';
    document.body.dataset.theme = chosen;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = chosen === 'light' ? '#f4f7fc' : '#070b14';
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.classList.toggle('selected', button.dataset.themeChoice === chosen));
  }
  function loadThemeForAccount(userId) {
    let theme = 'dark';
    try { theme = localStorage.getItem(themeStorageKey(userId)) || localStorage.getItem('abarox:theme:last') || 'dark'; } catch (_) {}
    applyTheme(theme);
  }
  function saveThemeChoice(theme) {
    const chosen = theme === 'light' ? 'light' : 'dark';
    try {
      localStorage.setItem(themeStorageKey(window.__abaroxCurrentUserId || 'guest'), chosen);
      localStorage.setItem('abarox:theme:last', chosen);
    } catch (_) { /* keep the selected theme active for this session */ }
    applyTheme(chosen);
  }
  loadThemeForAccount(window.__abaroxCurrentUserId || null);
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => saveThemeChoice(button.dataset.themeChoice)));

  function renderAuthSession(user) {
    window.__abaroxCurrentUserId = user?.id || null;
    loadThemeForAccount(window.__abaroxCurrentUserId);
    if (typeof loadAccountSettings === 'function') loadAccountSettings();
    const welcomePoster = document.querySelector('#feed .welcome');
    if (welcomePoster) welcomePoster.hidden = !!user;
    if (authSessionPanel) {
      authSessionPanel.hidden = !user;
      if (user && authSessionText) authSessionText.textContent = `Signed in as ${user.email || 'ABAROX user'}.`;
    }
    refreshYunexId(user);
    loadCurrentAccountProfile(user);
  }

  function enterHomeAfterAuth() {
    setAuthMode('register');
    if (currentView !== 'feed') {
      history.replaceState({ yunex: true, view: 'feed' }, '', location.pathname + location.search);
      renderView('feed');
    }
  }

  if (!yunexSupabase) {
    setAuthFeedback(registrationFeedback, 'Supabase load nahi hua. Internet connection aur supabase-config.js check karein.', true);
    setAuthFeedback(loginFeedback, 'Supabase load nahi hua. Internet connection aur configuration check karein.', true);
  } else {
    yunexSupabase.auth.getSession().then(({ data, error }) => {
      if (error) console.warn('Could not read YUNEX session:', error.message);
      const user = data?.session?.user || null;
      renderAuthSession(user);
      if (user) enterHomeAfterAuth();
    });
    yunexSupabase.auth.onAuthStateChange((eventName, session) => {
      const user = session?.user || null;
      renderAuthSession(user);
      // TOKEN_REFRESHED / USER_UPDATED can occur when Android returns from
      // the system photo picker. Only a real sign-in should force Home Feed.
      if (user && eventName === 'SIGNED_IN') enterHomeAfterAuth();
    });
  }

  if (registrationForm) registrationForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (authActionBusy) return;
    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const mobile = document.getElementById('regMobile').value;
    const pass = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const username = document.getElementById('regUsername').value.trim();
    const gender = registrationForm.querySelector('input[name="regGender"]:checked');
    const celebrity = document.getElementById('celebrityCheck').checked;
    let message = '';
    if (fullName.length < 2) message = 'Full name kam se kam 2 characters ka hona chahiye.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) message = 'Valid email address enter karein.';
    else if (!/^[0-9]{10}$/.test(mobile)) message = 'Mobile number exactly 10 digits ka hona chahiye.';
    else if (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass)) message = 'Password kam se kam 8 characters ka ho aur letters + digits dono hon.';
    else if (pass !== confirm) message = 'Password aur Confirm Password match nahi karte.';
    else if (!/^[A-Za-z0-9_.]{3,24}$/.test(username)) message = 'Username 3–24 characters ka ho; letters, numbers, _ aur . allowed hain.';
    else if (!gender) message = 'Please Male ya Female select karein.';
    if (message) { setAuthFeedback(registrationFeedback, message, true); return; }
    if (!yunexSupabase) { setAuthFeedback(registrationFeedback, 'Supabase connection available nahi hai. Page reload karke dobara try karein.', true); return; }

    authActionBusy = true;
    const submitButton = document.getElementById('demoRegister');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Creating account…'; }
    setAuthFeedback(registrationFeedback, 'Supabase par account create ho raha hai…');
    try {
      const { data, error } = await yunexSupabase.auth.signUp({
        email,
        password: pass,
        options: {
          // Keep the existing GitHub Pages project path (/YUNEX/) in the confirmation redirect.
          emailRedirectTo: new URL('./', window.location.href).toString(),
          data: {
            full_name: fullName,
            username,
            phone_number: mobile,
            celebrity_request: celebrity,
            // Gender is deliberately not sent to public profile metadata.
          }
        }
      });
      if (error) throw error;

      // Existing database trigger must generate yunex_id and the default role.
      // The client deliberately does not insert profiles, roles, or Account IDs.
      if (data?.session?.user) {
        await syncAuthenticatedProfile(data.session.user);
        renderAuthSession(data.session.user);
        enterHomeAfterAuth();
        setAuthFeedback(registrationFeedback, 'Account create ho gaya! Welcome to ABAROX.');
      } else {
        setAuthFeedback(registrationFeedback, 'Registration request successful. Email confirmation required ho sakta hai—apna inbox check karein. Confirmation ke baad isi email aur password se Login karein.');
      }

      // Keep only the existing local preview behavior for the private animation preference.
      // No password or OTP is stored in localStorage.
      try {
        localStorage.setItem('yunexRegistrationPreview', JSON.stringify({
          username, gender: gender.value, celebrityRequest: celebrity, status: 'preview-only'
        }));
        // Preserve the original on-device Celebrity pending-request preview.
        if (celebrity) {
          const requests = JSON.parse(localStorage.getItem('yunexCelebrityRequests') || '[]');
          requests.push({ username, createdAt: new Date().toISOString(), status: 'pending' });
          localStorage.setItem('yunexCelebrityRequests', JSON.stringify(requests));
        }
      } catch (_) {}
      document.getElementById('regPassword').value = '';
      document.getElementById('regConfirmPassword').value = '';
    } catch (error) {
      const msg = error?.message || 'Registration failed. Please try again.';
      setAuthFeedback(registrationFeedback, msg, true);
    } finally {
      authActionBusy = false;
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Create account'; }
    }
  });

  if (loginForm) loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (authActionBusy) return;
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      setAuthFeedback(loginFeedback, 'Registered email aur password dono bharein.', true); return;
    }
    if (!yunexSupabase) { setAuthFeedback(loginFeedback, 'Supabase connection available nahi hai. Page reload karke dobara try karein.', true); return; }
    authActionBusy = true;
    const button = document.getElementById('yunexLoginButton');
    if (button) { button.disabled = true; button.textContent = 'Logging in…'; }
    setAuthFeedback(loginFeedback, 'Supabase se login ho raha hai…');
    try {
      const { data, error } = await yunexSupabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await syncAuthenticatedProfile(data.user);
      renderAuthSession(data.user);
      setAuthFeedback(loginFeedback, `Login successful. Welcome to ABAROX, ${data.user.user_metadata?.full_name || data.user.email}.`);
      document.getElementById('loginPassword').value = '';
      enterHomeAfterAuth();
    } catch (error) {
      setAuthFeedback(loginFeedback, error?.message || 'Login failed. Please check your email and password.', true);
    } finally {
      authActionBusy = false;
      if (button) { button.disabled = false; button.textContent = 'Login to ABAROX'; }
    }
  });

  async function yunexLogout() {
    if (!yunexSupabase) return;
    const feedback = document.getElementById('profileLogoutFeedback');
    const { error } = await yunexSupabase.auth.signOut();
    if (error) {
      if (feedback) feedback.textContent = `Logout error: ${error.message}`;
      else if (authSessionText) authSessionText.textContent = `Logout error: ${error.message}`;
      return;
    }
    renderAuthSession(null);
    const settingsOverlay = document.getElementById('founderDatesOverlay');
    if (settingsOverlay) settingsOverlay.hidden = true;
    setAuthMode('login');
    setAuthFeedback(loginFeedback, 'You have been logged out.');
    enterHomeAfterAuth();
  }
  const logoutButton = document.getElementById('yunexLogoutButton');
  if (logoutButton) logoutButton.addEventListener('click', yunexLogout);
  const profileLogoutButton = document.getElementById('yunexProfileLogoutButton');
  if (profileLogoutButton) profileLogoutButton.addEventListener('click', yunexLogout);

  const forgotPasswordButton = document.getElementById('forgotPasswordButton');
  if (forgotPasswordButton) forgotPasswordButton.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthFeedback(loginFeedback, 'Pehle registered email address enter karein.', true); return;
    }
    if (!yunexSupabase) { setAuthFeedback(loginFeedback, 'Supabase connection available nahi hai.', true); return; }
    const { error } = await yunexSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    setAuthFeedback(loginFeedback, error ? error.message : 'Password reset link email par bhej diya gaya hai. Inbox check karein.', !!error);
  });

  // Founder password changes use the currently authenticated Supabase session.
  const changeFounderPassword = document.getElementById('changeFounderPassword');
  if (changeFounderPassword) changeFounderPassword.addEventListener('click', async () => {
    const pass = document.getElementById('founderNewPassword')?.value || '';
    const confirm = document.getElementById('founderConfirmPassword')?.value || '';
    if (!pass || !confirm) { alert('Dono password fields bharein.'); return; }
    if (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass)) { alert('Password kam se kam 8 characters ka ho aur letters + digits dono hon.'); return; }
    if (pass !== confirm) { alert('Dono passwords match nahi kar rahe.'); return; }
    if (!yunexSupabase) { alert('Supabase connection available nahi hai.'); return; }
    const { data } = await yunexSupabase.auth.getSession();
    if (!data?.session) { alert('Pehle Founder account se Login karein.'); setAuthMode('login'); navigate('account'); return; }
    const { error } = await yunexSupabase.auth.updateUser({ password: pass });
    document.getElementById('founderNewPassword').value = '';
    document.getElementById('founderConfirmPassword').value = '';
    if (error) alert(`Password update nahi hua: ${error.message}`);
  });


  document.querySelectorAll('.category-grid button').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('exploreSearch').value = button.innerText.replace(/[^\w\s]/g, '').trim();
    });
  });

  // Public creator lookup by username OR ABAROX ID. Supabase RLS remains
  // authoritative: private profiles that the viewer cannot read never appear.
  const exploreSearch = document.getElementById('exploreSearch');
  const exploreResults = document.getElementById('exploreSearchResults');
  let exploreSearchTimer = null;

  function openSearchedProfile(profile) {
    if (!profile || !profile.id) return;
    const name = profile.full_name || 'ABAROX User';
    const handle = '@' + (profile.username || 'user');
    activeDemoUser = { name, handle };

    const nameEl = document.getElementById('demoName');
    const handleEl = document.getElementById('demoHandle');
    const bioEl = document.getElementById('demoBio');
    const idEl = document.getElementById('demoAccountId');
    const avatarEl = document.getElementById('demoAvatar');
    const founderBadge = document.getElementById('demoFounderBadge');

    if (nameEl) nameEl.textContent = name;
    if (handleEl) handleEl.textContent = handle;
    if (bioEl) bioEl.textContent = profile.bio || 'No bio added yet.';
    if (idEl) idEl.textContent = profile.yunex_id || 'ID unavailable';
    if (avatarEl) {
      avatarEl.dataset.profileAvatar = `user:${profile.id}`;
      avatarEl.dataset.remoteAvatar = 'false';
      avatarEl.innerHTML = '';
      avatarEl.textContent = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      renderProfileAvatar(avatarEl, `user:${profile.id}`, name.slice(0, 1).toUpperCase());
    }
    if (founderBadge) founderBadge.hidden = profile.id !== FOUNDER_AUTH_ID;

    const follow = document.getElementById('followDemo');
    if (follow) { follow.textContent = 'Follow'; follow.classList.remove('following'); }
    const chatName = document.getElementById('chatName');
    if (chatName) chatName.textContent = name;
    const chatAvatar = document.getElementById('chatAvatar');
    if (chatAvatar) {
      chatAvatar.dataset.profileAvatar = `user:${profile.id}`;
      chatAvatar.textContent = name.slice(0, 1).toUpperCase();
    }
    refreshAllProfileAvatars();
    // Supabase avatar_path is public only for profiles returned by the SELECT
    // policy; use the existing public avatars bucket without changing its rules.
    if (avatarEl && profile.avatar_path && yunexSupabase) {
      const publicUrl = /^https?:\/\//i.test(profile.avatar_path)
        ? profile.avatar_path
        : yunexSupabase.storage.from('avatars').getPublicUrl(profile.avatar_path).data?.publicUrl;
      if (publicUrl) {
        avatarEl.dataset.remoteAvatar = 'true';
        let remoteImage = avatarEl.querySelector('img.profile-avatar-image');
        if (!remoteImage) {
          avatarEl.textContent = '';
          remoteImage = document.createElement('img');
          remoteImage.className = 'profile-avatar-image';
          remoteImage.alt = `${name} profile photo`;
          remoteImage.referrerPolicy = 'no-referrer';
          avatarEl.appendChild(remoteImage);
        }
        remoteImage.src = publicUrl;
      }
    }
    navigate('demoProfile');
  }

  if (exploreSearch && exploreResults) exploreSearch.addEventListener('input', () => {
    clearTimeout(exploreSearchTimer);
    const rawTerm = exploreSearch.value.trim();
    const term = rawTerm.replace(/^@/, '');
    if (term.length < 2) {
      exploreResults.textContent = 'Username ya ABAROX ID se search karein (kam se kam 2 characters).';
      return;
    }
    exploreResults.textContent = 'Searching…';
    exploreSearchTimer = setTimeout(async () => {
      if (!yunexSupabase) { exploreResults.textContent = 'Search service is unavailable.'; return; }
      try {
        const looksLikeId = /^(ABX-)?[0-9]{2,}$/i.test(term) || /^ABX-/i.test(term);
        const searchValue = looksLikeId && !/^ABX-/i.test(term) ? `ABX-${term}` : term;
        let query = yunexSupabase.from('profiles')
          .select('id, full_name, username, yunex_id, bio, avatar_path');
        query = looksLikeId
          ? query.ilike('yunex_id', `%${searchValue}%`)
          : query.ilike('username', `%${term}%`);
        const { data, error } = await query.limit(20);
        if (error) throw error;
        exploreResults.replaceChildren();
        if (!data?.length) {
          exploreResults.textContent = looksLikeId
            ? 'Koi matching public ABAROX ID nahi mili.'
            : 'Koi matching public username nahi mila.';
          return;
        }
        data.forEach(profile => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'explore-result-item';
          item.setAttribute('aria-label', `Open ${profile.full_name || profile.username || 'user'} profile`);
          const name = document.createElement('b'); name.textContent = profile.full_name || 'ABAROX User';
          const username = document.createElement('span'); username.textContent = '@' + (profile.username || '');
          const id = document.createElement('small'); id.textContent = profile.yunex_id || 'ABAROX ID unavailable';
          item.append(name, username, id);
          item.addEventListener('click', () => openSearchedProfile(profile));
          exploreResults.appendChild(item);
        });
      } catch (error) {
        exploreResults.textContent = 'Search failed. Supabase profiles SELECT policy/RLS ko check karna hoga.';
        console.warn('Explore profile search failed:', error.message);
      }
    }, 350);
  });

  // Word/context-based ABAROX chat animation trigger. No animation button or picker.
  const autoAnimationRules = [
    { kind:'horror', label:'Horror', patterns:[/\bboo\b/i,/\bghost\b/i,/\bhorror\b/i,/\bscary\b/i,/\bspooky\b/i,/\b डर\b/u,/\bdar+r?\b|\bdarna\b|\bdarawna\b/i,/डर(?:ा|ी|े|ना|ावना)?/u,/भूत|भूतिया|चुड़ैल|डरावना/u] },
    { kind:'kiss', label:'Kiss', patterns:[/\bkiss(?:ing|ed)?\b/i,/\bkisses\b/i,/\bkiss(?:i|y|ee)\s*(?:do|de|dena|diyo|please|me)\b/i,/\bmuah\b/i,/\bchumma\b/i,/\bpappi\b/i,/\bchum(?:na|o|u|a)\b/i,/चुम्मा|चूम|पप्पी/u,/kiss\s*कर|kiss\s*दे|kiss\s*दो/i] },
    { kind:'love', label:'Love', patterns:[/\bi\s*(?:really\s*)?love\s*you\b/i,/\blove\s*you\b/i,/\bluv\s*u\b/i,/\bily\b/i,/\bmy\s*love\b/i,/\bpyar\b|\bpyaar\b|\bmohabbat\b|\bishq\b/i,/प्यार|प्रेम|मोहब्बत|इश्क/u] },
    { kind:'miss', label:'Miss You', patterns:[/\bmiss\s*you\b/i,/\bmissing\s*you\b/i,/\bi\s*miss\s*u\b/i,/\byaad\s*aa\b/i,/\byad\s*aa\b/i,/\byaad\s*kar(?:ta|ti)?\b/i,/याद\s*(?:आ|कर)|तुम्हारी\s*याद|तेरी\s*याद/u] },
    { kind:'cry', label:'Cry', patterns:[/\b(?:i am|im|i'm)?\s*cry(?:ing)?\b/i,/\bsob(?:bing)?\b/i,/\btears\b/i,/\bro\s*raha\b|\bro\s*rahi\b|\brona\b|\bsad\b|\budaas\b/i,/😭|😢|🥲|😿|रो\s*रहा|रो\s*रही|रोना|आँसू|आंसू/u] },
    { kind:'laugh', label:'Laugh', patterns:[/\b(?:haha+|hehe+|lol+|lmao|rofl)\b/i,/\bfunny\b/i,/\blaugh(?:ing|ed)?\b/i,/\bhasi\b|\bhasna\b|\bhans\b/i,/😂|🤣|😆|हँस|हंस|मज़ाक|मजाक/u] }
  ];
  const animationNegation = /\b(?:don't|dont|do not|not|never|stop|no|mat|nahi|nahin|na)\b|मत|नहीं|ना/u;
  function detectAutoAnimation(text) {
    const normalized = String(text || '').toLowerCase().replace(/[\u200b-\u200d]/g,' ').replace(/[.!?,;]+/g,' ');
    for (const rule of autoAnimationRules) {
      const match = rule.patterns.some(pattern => pattern.test(normalized));
      if (!match) continue;
      // Negation near the detected intent suppresses the animation. Keep common
      // positive constructions ("I can't stop laughing") from being suppressed.
      const negated = animationNegation.test(normalized) && !/can't\s+stop\s+(?:laugh|lov)|cannot\s+stop\s+(?:laugh|lov)/i.test(normalized);
      if (negated) return null;
      return rule.kind;
    }
    return null;
  }
  function createCartoonCharacter(role, index) {
    const character = document.createElement('div');
    character.className = `abx-svg-character ${role} character-${index}`;
    const isGirl = role === 'char-two';
    const hair = isGirl ? '#33202a' : '#24151d';
    const jacket = isGirl ? '#087be9' : '#111a2b';
    const accent = isGirl ? '#55b9ff' : '#168bff';
    const bow = isGirl ? '<g class="abx-bow"><path d="M130 37 Q108 14 112 37 Q109 55 130 49 Q149 63 150 43 Q153 23 130 37Z" fill="#087cff" stroke="#7bc7ff" stroke-width="3"/><circle cx="131" cy="43" r="7" fill="#034cae"/></g>' : '';
    const eyeExpression = '<g class="abx-eyes"><ellipse cx="65" cy="83" rx="11" ry="16" fill="#152b50"/><ellipse cx="99" cy="83" rx="11" ry="16" fill="#152b50"/><ellipse cx="62" cy="78" rx="4" ry="6" fill="#fff"/><ellipse cx="96" cy="78" rx="4" ry="6" fill="#fff"/></g>';
    character.innerHTML = `<svg viewBox="0 0 170 230" class="abx-character-svg" role="presentation">
      <defs><linearGradient id="skin-${index}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe4cc"/><stop offset=".62" stop-color="#f4c4a1"/><stop offset="1" stop-color="#d98f74"/></linearGradient>
      <linearGradient id="cloth-${index}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset=".6" stop-color="${jacket}"/><stop offset="1" stop-color="#070c17"/></linearGradient>
      <linearGradient id="hair-${index}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6b4851"/><stop offset=".3" stop-color="${hair}"/><stop offset="1" stop-color="#100b12"/></linearGradient>
      <filter id="soft-${index}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter></defs>
      <ellipse cx="85" cy="217" rx="55" ry="9" fill="#030814" opacity=".3" filter="url(#soft-${index})"/>
      <g class="abx-character-body"><path d="M54 135 Q42 141 38 160 L29 190 Q29 200 43 202 L57 181 L61 162 L72 177 L76 202 Q85 208 99 202 L101 174 L114 188 L125 201 Q140 198 138 187 L120 156 Q115 139 105 135Z" fill="url(#cloth-${index})" stroke="#243c63" stroke-width="2"/>
      <path d="M58 145 L80 177 L105 145" fill="none" stroke="${accent}" stroke-width="5" opacity=".9"/>
      <path d="M48 156 Q32 168 43 181 L57 177" fill="url(#skin-${index})" stroke="#c78b72" stroke-width="1.5" class="abx-arm-a"/><path d="M112 155 Q133 166 122 181 L111 177" fill="url(#skin-${index})" stroke="#c78b72" stroke-width="1.5" class="abx-arm-b"/>
      <path d="M60 188 L57 211 Q63 218 78 216 L81 190" fill="#18233a"/><path d="M92 190 L96 212 Q110 218 122 214 L117 189" fill="#18233a"/><path d="M51 211 Q42 214 39 224 Q42 229 75 227 Q83 223 78 216Z" fill="#f4f7ff" stroke="#8da9d3" stroke-width="2"/><path d="M92 213 Q87 217 89 225 Q96 230 126 226 Q132 222 121 215Z" fill="#f4f7ff" stroke="#8da9d3" stroke-width="2"/>
      <path d="M54 45 Q42 51 39 72 L45 117 Q52 136 72 140 L111 138 Q130 127 132 106 L133 70 Q126 47 107 40Z" fill="url(#skin-${index})" stroke="#b97762" stroke-width="1.5"/>
      <path d="M39 69 Q30 35 61 23 Q78 7 105 18 Q132 22 137 52 Q140 72 126 83 L120 57 Q99 62 84 45 Q65 62 48 58Z" fill="url(#hair-${index})" stroke="#180f17" stroke-width="2"/>
      <path d="M44 43 Q50 24 67 28 Q58 39 57 53 Q72 32 86 30 Q76 48 75 57 Q93 33 111 32 Q103 46 106 56 Q124 41 132 58 Q132 39 119 25 Q100 6 75 15 Q48 12 38 39Z" fill="url(#hair-${index})" stroke="#4a303b" stroke-width="2"/>
      <path d="M49 51 Q61 43 70 31 M71 53 Q84 38 92 27 M99 50 Q113 36 123 40" fill="none" stroke="#9b6a77" stroke-width="3" stroke-linecap="round" opacity=".45"/>
      ${eyeExpression}<path d="M55 66 Q65 61 74 65 M90 65 Q101 61 110 66" fill="none" stroke="#3b2228" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="54" cy="100" rx="12" ry="6" fill="#f28e9d" opacity=".5"/><ellipse cx="112" cy="100" rx="12" ry="6" fill="#f28e9d" opacity=".5"/>
      <path d="M80 98 Q85 103 89 98" fill="none" stroke="#bb6d67" stroke-width="2"/><path d="M77 111 Q85 120 95 111" fill="none" stroke="#9b3f55" stroke-width="3" stroke-linecap="round" class="abx-mouth"/>
      ${bow}</g></svg>`;
    return character;
  }
  function showAutoAnimation(kind) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const old = messages.querySelector('.abx-animation-scene'); if (old) old.remove();
    const scene = document.createElement('div'); scene.className = `abx-animation-scene abx-scene-${kind}`; scene.setAttribute('aria-hidden','true');
    const stage = document.createElement('div'); stage.className = 'abx-animation-stage';
    stage.append(createCartoonCharacter('char-one',1), createCartoonCharacter('char-two',2));
    const effects = document.createElement('div'); effects.className = 'abx-effects';
    for (let i=0;i<8;i++){ const particle=document.createElement('i'); particle.className=`abx-particle p${i+1}`; effects.appendChild(particle); }
    const extras = document.createElement('div'); extras.className = 'abx-scene-extras';
    if(kind==='love') extras.innerHTML='<div class="abx-big-heart">♥</div>';
    if(kind==='miss') extras.innerHTML='<div class="abx-thought-heart">♡</div>';
    if(kind==='cry') extras.innerHTML='<i class="abx-tear t1"></i><i class="abx-tear t2"></i>';
    if(kind==='horror') extras.innerHTML='<div class="abx-ghost"><svg viewBox="0 0 100 110"><path d="M15 94V47C15 22 32 7 51 7S86 22 86 47V94L73 84 60 95 48 84 34 95 22 84Z" fill="#d9f8ff" stroke="#6dbfff" stroke-width="4"/><ellipse cx="38" cy="43" rx="9" ry="13" fill="#061b42"/><ellipse cx="65" cy="43" rx="9" ry="13" fill="#061b42"/><ellipse cx="38" cy="43" rx="4" ry="6" fill="#31c8ff"/><ellipse cx="65" cy="43" rx="4" ry="6" fill="#31c8ff"/><ellipse cx="52" cy="67" rx="10" ry="14" fill="#142b50"/></svg></div>';
    scene.append(stage,effects,extras); messages.appendChild(scene);
    requestAnimationFrame(()=>scene.classList.add('show'));
    window.setTimeout(()=>scene.classList.add('fade-out'),1900);
    window.setTimeout(()=>scene.remove(),2350);
  }
  function showAutoAnimation(kind) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const old = messages.querySelector('.abx-animation-scene'); if (old) old.remove();
    const scene = document.createElement('div'); scene.className = `abx-animation-scene abx-scene-${kind}`; scene.setAttribute('aria-hidden','true');
    const stage = document.createElement('div'); stage.className = 'abx-animation-stage';
    stage.append(createCartoonCharacter('char-one',1), createCartoonCharacter('char-two',2));
    const effects = document.createElement('div'); effects.className = 'abx-effects';
    for (let i=0;i<6;i++){ const particle=document.createElement('i'); particle.className=`abx-particle p${i+1}`; effects.appendChild(particle); }
    scene.append(stage,effects); messages.appendChild(scene);
    requestAnimationFrame(()=>scene.classList.add('show'));
    window.setTimeout(()=>scene.classList.add('fade-out'),1750);
    window.setTimeout(()=>scene.remove(),2200);
  }

  // Chat status preview: all delivery/read states below are simulated locally.
  // Real Sent/Delivered/Seen receipts require authenticated Supabase messaging.
  // Founder profile: editable local preview. Real identity/permissions remain server-controlled.
  const founderDefaults = { name: 'Aman Bareth', handle: '@amanbareth', bio: 'Building ABAROX — a place to connect, create and win. 🚀' };
  let founderProfile = { ...founderDefaults };
  try {
    const savedFounder = JSON.parse(localStorage.getItem('yunexFounderProfile') || 'null');
    if (savedFounder && typeof savedFounder === 'object') founderProfile = { ...founderDefaults, ...savedFounder };
  } catch (_) {}
  const founderNameEl = document.getElementById('founderName');
  const founderHandleEl = document.getElementById('founderHandle');
  const founderBioEl = document.getElementById('founderBio');
  const founderEditOverlay = document.getElementById('founderEditOverlay');
  function paintFounderProfile() {
    if (founderNameEl) founderNameEl.textContent = founderProfile.name;
    if (founderHandleEl) founderHandleEl.textContent = founderProfile.handle.startsWith('@') ? founderProfile.handle : '@' + founderProfile.handle;
    if (founderBioEl) founderBioEl.textContent = founderProfile.bio || 'Add a bio to introduce yourself.';
    const topName = document.getElementById('topAccountName');
    if (topName) topName.textContent = founderProfile.name;
    const photo = document.getElementById('founderPhoto');
    if (photo && !photo.querySelector('img')) photo.textContent = founderProfile.name.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
  }
  paintFounderProfile();
  const notificationsButton = document.getElementById('notificationsButton');
  if (notificationsButton) notificationsButton.addEventListener('click', () => window.alert('You are all caught up. Notifications will appear here.'));
  const editFounderButton = document.getElementById('editFounderProfile');
  if (editFounderButton) editFounderButton.addEventListener('click', () => {
    document.getElementById('editFounderName').value = document.getElementById('founderName')?.textContent || '';
    document.getElementById('editFounderHandle').value = (document.getElementById('founderHandle')?.textContent || '').replace(/^@/, '');
    document.getElementById('editFounderBio').value = document.getElementById('founderBio')?.textContent || '';
    founderEditOverlay.hidden = false;
  });
  const closeFounderEdit = document.getElementById('closeFounderEdit');
  if (closeFounderEdit) closeFounderEdit.addEventListener('click', () => { founderEditOverlay.hidden = true; });
  if (founderEditOverlay) founderEditOverlay.addEventListener('click', event => { if (event.target === founderEditOverlay) founderEditOverlay.hidden = true; });
  const founderEditForm = document.getElementById('founderEditForm');
  if (founderEditForm) founderEditForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!yunexSupabase) { alert('Supabase connection available nahi hai.'); return; }
    const { data: sessionData } = await yunexSupabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) { alert('Profile update karne ke liye login karein.'); return; }
    const name = document.getElementById('editFounderName').value.trim();
    const username = document.getElementById('editFounderHandle').value.trim().replace(/^@/, '').replace(/\s+/g, '').toLowerCase();
    const bio = document.getElementById('editFounderBio').value;
    if (!name || !/^[A-Za-z0-9_.]{3,24}$/.test(username)) { alert('Valid name aur 3-24 character username enter karein.'); return; }
    const saveButton = founderEditForm.querySelector('button[type=submit]');
    if (saveButton) { saveButton.disabled = true; saveButton.textContent = 'Saving…'; }
    try {
      const { error } = await yunexSupabase.from('profiles').update({ full_name: name, username, bio }).eq('id', user.id);
      if (error) throw error;
      if (user.id === FOUNDER_AUTH_ID) founderProfile = { name, handle: '@' + username, bio };
      if (user.id === FOUNDER_AUTH_ID) { try { localStorage.setItem('yunexFounderProfile', JSON.stringify(founderProfile)); } catch (_) {} }
      await loadCurrentAccountProfile(user);
      founderEditOverlay.hidden = true;
      // Successful saves stay silent; the updated profile is already visible.
    } catch (error) { alert('Profile save nahi hui: ' + error.message); }
    finally { if (saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save changes'; } }
  });
  const founderSettingsButton = document.getElementById('founderSettings');
  const founderPhotoInput=document.getElementById('founderPhotoInput'),photoAdjustOverlay=document.getElementById('photoAdjustOverlay'),photoAdjustPreview=document.getElementById('photoAdjustPreview');
  let pendingPhotoData='',photoTransform={zoom:1,x:50,y:50};

  function paintPhotoPreview(){
    if(photoAdjustPreview){
      photoAdjustPreview.style.objectPosition=`${photoTransform.x}% ${photoTransform.y}%`;
      photoAdjustPreview.style.transform=`scale(${Number(photoTransform.zoom)||1}) rotate(${photoTransform.rotation||0}deg)`;
      photoAdjustPreview.style.transformOrigin='center center';
    }
    const zoomControl=document.getElementById('photoZoom');
    const rotationControl=document.getElementById('photoRotation');
    if(zoomControl)zoomControl.value=String(photoTransform.zoom);
    if(rotationControl)rotationControl.value=String(photoTransform.rotation||0);
  }
  async function applyFounderPhoto(data,t=photoTransform){
    if(!yunexSupabase){alert('Supabase connection available nahi hai.');return false;}
    const { data: sessionData, error: sessionError } = await yunexSupabase.auth.getSession();
    if(sessionError) { alert('Login session check nahi ho saka: ' + sessionError.message); return false; }
    const user = sessionData?.session?.user;
    if(!user){alert('Photo update karne ke liye login karein.');return false;}
    try {
      // Render the chosen crop/zoom/rotation into a real square image before upload.
      const source = new Image();
      source.src = data;
      await new Promise((resolve,reject)=>{ source.onload=resolve; source.onerror=()=>reject(new Error('Photo load nahi ho paayi.')); });
      const size = 640, canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if(!ctx) throw new Error('Photo editor start nahi ho saka.');
      // First reproduce the preview's object-fit:cover + object-position crop.
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = size; cropCanvas.height = size;
      const cropCtx = cropCanvas.getContext('2d');
      if(!cropCtx) throw new Error('Photo crop create nahi ho saka.');
      const coverScale = Math.max(size/source.width, size/source.height);
      const drawW = source.width * coverScale, drawH = source.height * coverScale;
      const left = (size-drawW) * (Number(t?.x ?? 50)/100);
      const top = (size-drawH) * (Number(t?.y ?? 50)/100);
      cropCtx.drawImage(source, left, top, drawW, drawH);
      // Then apply the same zoom/rotation shown in the editor preview.
      const radians=(Number(t?.rotation)||0)*Math.PI/180;
      const finalScale=Math.max(1,Number(t?.zoom)||1);
      ctx.fillStyle = '#071426'; ctx.fillRect(0,0,size,size);
      ctx.save(); ctx.translate(size/2,size/2); ctx.rotate(radians); ctx.scale(finalScale,finalScale);
      ctx.drawImage(cropCanvas,-size/2,-size/2,size,size); ctx.restore();
      const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.9));
      if(!blob) throw new Error('Edited photo create nahi ho paayi.');
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await yunexSupabase.storage.from('avatars').upload(path, blob, { cacheControl:'3600', contentType:'image/jpeg', upsert:false });
      if(uploadError) throw uploadError;
      const { data: updatedRows, error: updateError } = await yunexSupabase.from('profiles').update({ avatar_path:path }).eq('id',user.id).select('id,avatar_path');
      if(updateError || !updatedRows?.length) {
        await yunexSupabase.storage.from('avatars').remove([path]);
        throw updateError || new Error('Profile row update nahi hui. Apni profile update policy check karein.');
      }
      // Clear any stale per-user local preview; Supabase remains the source of truth.
      try { localStorage.removeItem(profilePhotoKey(user.id === FOUNDER_AUTH_ID ? 'founder' : `user:${user.id}`)); } catch(_) {}
      await loadCurrentAccountProfile(user);
      refreshAllProfileAvatars();
      return true;
    } catch(error) {
      console.error('Avatar upload/update failed:', error);
      alert('Photo save nahi hui: ' + (error?.message || error));
      return false;
    }
  }

  if(founderPhotoInput)founderPhotoInput.addEventListener('change',(event)=>{
    event.stopPropagation();
    const file=founderPhotoInput.files&&founderPhotoInput.files[0]; if(!file||!file.type.startsWith('image/'))return;
    const reader=new FileReader(); reader.onload=()=>{pendingPhotoData=String(reader.result||'');photoTransform={zoom:1,x:50,y:50,rotation:0};if(photoAdjustPreview)photoAdjustPreview.src=pendingPhotoData;paintPhotoPreview();if(photoAdjustOverlay){photoAdjustOverlay.hidden=false;document.body.classList.add('photo-adjust-open');}window.scrollTo(0,0);}; reader.onerror=()=>alert('Selected photo read nahi ho paayi. Dusri photo try karein.'); reader.readAsDataURL(file); founderPhotoInput.value='';
  });
  // Direct manipulation: one-finger pan; two-finger pinch zoom + full 360-degree rotation.
  const adjustStage=document.querySelector('.photo-adjust-preview');
  let cropPointers=new Map(),gestureStart=null;
  const pointDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const pointAngle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
  if(adjustStage){
    adjustStage.style.touchAction='none';
    adjustStage.addEventListener('contextmenu',e=>e.preventDefault());
    adjustStage.addEventListener('pointerdown',e=>{
      e.preventDefault(); adjustStage.setPointerCapture(e.pointerId);
      cropPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(cropPointers.size===1) gestureStart={mode:'pan',x:e.clientX,y:e.clientY,px:photoTransform.x,py:photoTransform.y};
      if(cropPointers.size===2){
        const pts=[...cropPointers.values()];
        gestureStart={mode:'pinch',distance:pointDistance(pts[0],pts[1]),angle:pointAngle(pts[0],pts[1]),zoom:photoTransform.zoom,rotation:photoTransform.rotation||0};
      }
    });
    adjustStage.addEventListener('pointermove',e=>{
      if(!cropPointers.has(e.pointerId))return;
      cropPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      const pts=[...cropPointers.values()];
      if(pts.length>=2 && gestureStart && gestureStart.mode==='pinch'){
        const dist=pointDistance(pts[0],pts[1]);
        const angle=pointAngle(pts[0],pts[1]);
        photoTransform.zoom=Math.max(1,Math.min(4,gestureStart.zoom*(dist/Math.max(1,gestureStart.distance))));
        let delta=angle-gestureStart.angle;
        if(delta>180)delta-=360; if(delta<-180)delta+=360;
        photoTransform.rotation=((gestureStart.rotation+delta)%360+360)%360;
      } else if(pts.length===1 && gestureStart && gestureStart.mode==='pan'){
        const rect=adjustStage.getBoundingClientRect();
        photoTransform.x=Math.max(0,Math.min(100,gestureStart.px-(e.clientX-gestureStart.x)/rect.width*100));
        photoTransform.y=Math.max(0,Math.min(100,gestureStart.py-(e.clientY-gestureStart.y)/rect.height*100));
      }
      paintPhotoPreview();
    });
    const stop=e=>{
      cropPointers.delete(e.pointerId);
      if(cropPointers.size===1){const p=[...cropPointers.values()][0];gestureStart={mode:'pan',x:p.x,y:p.y,px:photoTransform.x,py:photoTransform.y};}
      else if(cropPointers.size===0)gestureStart=null;
      else if(cropPointers.size===2){const pts=[...cropPointers.values()];gestureStart={mode:'pinch',distance:pointDistance(pts[0],pts[1]),angle:pointAngle(pts[0],pts[1]),zoom:photoTransform.zoom,rotation:photoTransform.rotation||0};}
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>adjustStage.addEventListener(t,stop));
  }
  const closePhotoAdjust=document.getElementById('closePhotoAdjust');if(closePhotoAdjust)closePhotoAdjust.addEventListener('click',()=>{photoAdjustOverlay.hidden=true;document.body.classList.remove('photo-adjust-open');pendingPhotoData='';});
  if(photoAdjustOverlay)photoAdjustOverlay.addEventListener('click',e=>{if(e.target===photoAdjustOverlay){photoAdjustOverlay.hidden=true;document.body.classList.remove('photo-adjust-open');pendingPhotoData='';}});
  const savePhotoAdjust=document.getElementById('savePhotoAdjust');if(savePhotoAdjust)savePhotoAdjust.addEventListener('click',async(e)=>{e.preventDefault();e.stopPropagation();if(!pendingPhotoData)return;savePhotoAdjust.disabled=true;const oldLabel=savePhotoAdjust.textContent;savePhotoAdjust.textContent='Saving…';const saved=await applyFounderPhoto(pendingPhotoData,photoTransform);savePhotoAdjust.disabled=false;savePhotoAdjust.textContent=oldLabel;if(saved){pendingPhotoData='';if(photoAdjustOverlay){photoAdjustOverlay.hidden=true;document.body.classList.remove('photo-adjust-open');}}});
  const founderPhoto=document.getElementById('founderPhoto'),photoLightbox=document.getElementById('founderPhotoLightbox'),photoLarge=document.getElementById('founderPhotoLarge');let photoHoldTimer=null,photoHoldFired=false;
  if(founderPhoto&&photoLightbox){
    founderPhoto.addEventListener('contextmenu',e=>e.preventDefault());
    founderPhoto.addEventListener('dragstart',e=>e.preventDefault());
    founderPhoto.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;photoHoldFired=false;clearTimeout(photoHoldTimer);photoHoldTimer=setTimeout(()=>{const image=founderPhoto.querySelector('img');if(!image)return;photoHoldFired=true;photoLarge.src=image.src;photoLarge.style.objectPosition=image.style.objectPosition||'50% 50%';photoLarge.style.transform='none';photoLightbox.hidden=false;},2000);});
    ['pointerup','pointerleave','pointercancel'].forEach(t=>founderPhoto.addEventListener(t,()=>clearTimeout(photoHoldTimer)));
    photoLightbox.addEventListener('click',()=>{photoLightbox.hidden=true;});photoLightbox.addEventListener('contextmenu',e=>e.preventDefault());
  }
  const founderDatesOverlay=document.getElementById('founderDatesOverlay');
  let founderDates={birthday:'',birthdayAlerts:false,specialDays:[]};
  function accountSettingsKey(kind) {
    const id = window.__abaroxCurrentUserId || 'guest';
    return `abarox:${kind}:${id}`;
  }
  function loadAccountSettings() {
    try {
      const datesKey = accountSettingsKey('dates');
      const privacyKey = accountSettingsKey('privacy');
      let savedDates = localStorage.getItem(datesKey);
      let savedPrivacy = localStorage.getItem(privacyKey);

      // One-time recovery: the previous update wrote Founder-only values to global keys.
      // Migrate those values only into the authenticated Founder account, never other users.
      if (window.__abaroxCurrentUserId === FOUNDER_AUTH_ID) {
        if (!savedDates) {
          const legacyDates = localStorage.getItem('yunexFounderDates');
          if (legacyDates) { savedDates = legacyDates; localStorage.setItem(datesKey, legacyDates); }
        }
        if (!savedPrivacy) {
          const legacyPrivacy = localStorage.getItem('yunexAccountPrivacy');
          if (legacyPrivacy) { savedPrivacy = legacyPrivacy; localStorage.setItem(privacyKey, legacyPrivacy); }
        }
      }
      founderDates = {birthday:'',birthdayAlerts:false,specialDays:[],...(savedDates ? JSON.parse(savedDates) : {})};
    } catch (_) {
      founderDates={birthday:'',birthdayAlerts:false,specialDays:[]};
    }
  }
  loadAccountSettings();

  function renderSpecialDays() {
    const list=document.getElementById('specialDaysList');
    if(!list)return;
    list.innerHTML='';
    founderDates.specialDays.forEach((d,i)=>{
      const row=document.createElement('div');
      row.className='special-day-item';
      const info=document.createElement('span');
      info.textContent=`${d.title} · ${d.date} · ${d.time}`;
      const rm=document.createElement('button');
      rm.type='button'; rm.textContent='Remove';
      rm.addEventListener('click',()=>{
        founderDates.specialDays.splice(i,1);
        renderSpecialDays();
      });
      row.append(info,rm); list.appendChild(row);
    });
  }
  function showSettingsPage(page) {
    document.querySelectorAll('#founderDatesOverlay [data-settings-page]').forEach(section => {
      section.hidden = section.dataset.settingsPage !== page;
    });
    const title = document.getElementById('founderDatesTitle');
    const pageTitles = { main:'Profile Settings', password:'Password', birthday:'Birthday', privacy:'Privacy', special:'My Special Days', theme:'Theme', logout:'Log out' };
    if (title) title.textContent = pageTitles[page] || 'Profile Settings';
  }
  // Delegated Settings navigation: resilient to mobile tap targets and page-cache updates.
  if (founderDatesOverlay) founderDatesOverlay.addEventListener('click', event => {
    const openButton = event.target.closest('[data-settings-open]');
    if (openButton) {
      event.preventDefault();
      showSettingsPage(openButton.dataset.settingsOpen);
      return;
    }
    const backButton = event.target.closest('[data-settings-back]');
    if (backButton) {
      event.preventDefault();
      showSettingsPage('main');
    }
  });
  function openFounderDates() {
    const birthday=document.getElementById('founderBirthday');
    const alerts=document.getElementById('founderBirthdayAlerts');
    const privateToggle=document.getElementById('privateAccountToggle');
    const tagToggle=document.getElementById('manualTagApproval');
    if(birthday)birthday.value=founderDates.birthday||'';
    if(alerts)alerts.checked=!!founderDates.birthdayAlerts;
    let privacy={};
    try { privacy=JSON.parse(localStorage.getItem(accountSettingsKey('privacy'))||'{}'); } catch (_) {}
    if(privateToggle)privateToggle.checked=!!privacy.isPrivate;
    if(tagToggle)tagToggle.checked=privacy.manualTagApproval!==false;
    renderSpecialDays();
    if(founderDatesOverlay){showSettingsPage('main');founderDatesOverlay.hidden=false;}
  }
  if(founderSettingsButton)founderSettingsButton.addEventListener('click',openFounderDates);

  // Account contact fields are a prototype-only convenience. Never persist passwords here.
  const founderAccountMobile=document.getElementById('founderAccountMobile');
  const founderAccountEmail=document.getElementById('founderAccountEmail');
  try {
    const savedContact=JSON.parse(localStorage.getItem('yunexFounderContactPreview')||'null');
    if(savedContact&&founderAccountMobile&&/^\d{10}$/.test(savedContact.mobile||''))founderAccountMobile.value=savedContact.mobile;
    if(savedContact&&founderAccountEmail&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(savedContact.email||''))founderAccountEmail.value=savedContact.email;
  } catch (_) {}
  const saveFounderContact=document.getElementById('saveFounderContact');
  if(saveFounderContact)saveFounderContact.addEventListener('click',()=>{
    const mobile=(founderAccountMobile?.value||'').trim();
    const email=(founderAccountEmail?.value||'').trim();
    if(!/^\d{10}$/.test(mobile)){alert('Mobile number exactly 10 digits ka hona chahiye.');return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){alert('Valid email address enter karein.');return;}
    try{localStorage.setItem('yunexFounderContactPreview',JSON.stringify({mobile,email}));}
    catch(_){alert('Is browser mein preview details save nahi ho paayi.');return;}
    // Successful saves stay silent; no confirmation popup.
  });

  const closeFounderDates=document.getElementById('closeFounderDates');
  if(closeFounderDates)closeFounderDates.addEventListener('click',()=>founderDatesOverlay.hidden=true);
  if(founderDatesOverlay)founderDatesOverlay.addEventListener('click',e=>{
    if(e.target===founderDatesOverlay)founderDatesOverlay.hidden=true;
  });
  const addSpecialDay=document.getElementById('addSpecialDay');
  if(addSpecialDay)addSpecialDay.addEventListener('click',()=>{
    const title=document.getElementById('specialDayTitle').value.trim();
    const date=document.getElementById('specialDayDate').value;
    const time=document.getElementById('specialDayTime').value||'09:00';
    if(!title||!date){alert('Special day name aur date dono bharo.');return;}
    founderDates.specialDays.push({title,date,time});
    document.getElementById('specialDayTitle').value='';
    document.getElementById('specialDayDate').value='';
    renderSpecialDays();
  });
  function saveFounderSettings() {
    founderDates.birthday=document.getElementById('founderBirthday').value;
    founderDates.birthdayAlerts=document.getElementById('founderBirthdayAlerts').checked;
    const privacy={
      isPrivate:document.getElementById('privateAccountToggle').checked,
      manualTagApproval:document.getElementById('manualTagApproval').checked
    };
    try {
      localStorage.setItem(accountSettingsKey('dates'),JSON.stringify(founderDates));
      localStorage.setItem(accountSettingsKey('privacy'),JSON.stringify(privacy));
    } catch (_) {
      alert('Profile settings save nahi ho paayi. Browser storage available nahi hai.');
      return;
    }
    // Successful saves stay silent. Keep the current layer open so the user can continue.
    showSettingsPage('main');
  }
  document.querySelectorAll('#founderDatesOverlay .settings-save').forEach(button => button.addEventListener('click', saveFounderSettings));
  // Cover/banner feature intentionally removed from the Founder profile.
  try { localStorage.removeItem('yunexFounderCoverPhoto'); } catch (_) {}

  document.querySelectorAll('[data-profile-tab]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('[data-profile-tab]').forEach(item => item.classList.toggle('selected', item === tab));
    const labels = { posts: ['No posts yet', 'Your photos and videos will appear here.'], reels: ['No reels yet', 'Your published videos will appear here.'], tagged: ['No tagged posts', 'Posts you are tagged in will appear here.'] };
    const copy = labels[tab.dataset.profileTab];
    document.getElementById('founderEmptyTitle').textContent = copy[0];
    document.getElementById('founderEmptyText').textContent = copy[1];
  }));

  const collabMessage = 'Brand Collaboration preview: creators aur brands campaign details, deliverables, promotion fee aur timeline share kar sakenge. Requests aur verified-brand checks Admin/backend se connect honge.';
  ['brandCollabFounder','brandCollabDemo'].forEach(id=>{const btn=document.getElementById(id);if(btn)btn.addEventListener('click',()=>alert(collabMessage));});
  document.querySelectorAll('[data-demo-profile-tab]').forEach(tab=>tab.addEventListener('click',()=>{
    document.querySelectorAll('[data-demo-profile-tab]').forEach(item=>item.classList.toggle('selected',item===tab));
    const copy={posts:['Posts','Creator photos and posts will appear here.'],reels:['Reels','Published short videos will appear here.'],tagged:['Tagged','Posts this creator is tagged in will appear here.']}[tab.dataset.demoProfileTab];
    document.getElementById('demoEmptyTitle').textContent=copy[0];document.getElementById('demoEmptyText').textContent=copy[1];
  }));

  const backFromDemoProfile = document.getElementById('backFromDemoProfile');
  if (backFromDemoProfile) backFromDemoProfile.remove();

  const shareFounderButton = document.getElementById('shareFounderProfile');
  if (shareFounderButton) shareFounderButton.addEventListener('click', async () => {
    const shareText = `${founderProfile.name} ${founderProfile.handle} · ABAROX Founder`;
    try {
      if (navigator.share) await navigator.share({ title: 'ABAROX Founder', text: shareText, url: location.href.split('#')[0] + '#profile' });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(shareText + ' · ' + location.href.split('#')[0] + '#profile'); shareFounderButton.textContent = 'Copied!'; }
      else shareFounderButton.textContent = 'Share unavailable';
    } catch (_) {}
  });

  const chatForm = document.getElementById('chatForm');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const presenceStatus = document.getElementById('chatPresenceStatus');
  const presenceText = document.getElementById('chatPresenceText');
  const deleteChatButton = document.getElementById('deleteChatButton');
  const chatGalleryButton = document.getElementById('chatGalleryButton');
  const chatGalleryInput = document.getElementById('chatGalleryInput');
  if (chatGalleryButton && chatGalleryInput) {
    chatGalleryButton.addEventListener('pointerdown', event => event.preventDefault());
    chatGalleryButton.addEventListener('click', () => chatGalleryInput.click());
    chatGalleryInput.addEventListener('change', () => {
      const file = chatGalleryInput.files && chatGalleryInput.files[0];
      if (!file || !chatMessages) return;
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble sent attachment-bubble';
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img'); img.alt = file.name || 'Photo attachment'; img.src = URL.createObjectURL(file); bubble.appendChild(img);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video'); video.controls = true; video.src = URL.createObjectURL(file); bubble.appendChild(video);
      } else { bubble.textContent = file.name; }
      addMessageMetaSafe(bubble);
      chatMessages.appendChild(bubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatGalleryInput.value = '';
      if (chatInput) chatInput.focus({ preventScroll: true });
    });
  }

  function setChatPresence(isTyping) {
    if (!presenceStatus || !presenceText) return;
    presenceText.textContent = isTyping ? 'Typing…' : 'Online';
    presenceStatus.classList.toggle('is-typing', !!isTyping);
    presenceStatus.setAttribute('aria-label', isTyping ? 'Typing' : 'Online');
  }

  if (deleteChatButton) deleteChatButton.addEventListener('click', () => {
    if (!chatMessages || !window.confirm('Delete all messages in this chat?')) return;
    chatMessages.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'chat-empty-state';
    empty.textContent = 'This chat is empty.';
    chatMessages.appendChild(empty);
    setChatPresence(false);
    if (chatInput) chatInput.focus({ preventScroll: true });
  });

  function addMessageMetaSafe(bubble) {
    const meta = document.createElement('div'); meta.className = 'message-meta sent-meta';
    const time = document.createElement('time'); time.textContent = messageTime(); meta.appendChild(time);
    const status = document.createElement('span'); status.className = 'message-status'; status.textContent = '· demo'; meta.appendChild(status);
    bubble.appendChild(meta);
  }

  function messageTime() {
    return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(new Date());
  }

  function addMessageMeta(bubble, statusText, isSent) {
    const meta = document.createElement('div');
    meta.className = 'message-meta' + (isSent ? ' sent-meta' : '');
    const time = document.createElement('time');
    time.textContent = messageTime();
    meta.appendChild(time);
    if (statusText) {
      const status = document.createElement('span');
      status.className = 'message-status';
      status.textContent = statusText;
      meta.appendChild(status);
    }
    bubble.appendChild(meta);
  }

  if (chatMessages && !chatMessages.querySelector('.chat-bubble.received .message-meta')) {
    const welcome = chatMessages.querySelector('.chat-bubble.received');
    if (welcome) addMessageMeta(welcome, '', false);
  }

  const chatSendButton = chatForm ? chatForm.querySelector('button[type="submit"]') : null;
  // Keep the mobile keyboard open when the Send control is tapped. Preventing
  // the button from taking focus avoids the input blur that hides Android's keyboard.
  if (chatSendButton) {
    chatSendButton.addEventListener('pointerdown', event => event.preventDefault());
    chatSendButton.addEventListener('mousedown', event => event.preventDefault());
  }

  if (chatForm) chatForm.addEventListener('submit', event => {
    event.preventDefault();
    const value = chatInput.value.trim();
    if (!value) return;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble sent';
    const messageText = document.createElement('div');
    messageText.textContent = value;
    bubble.appendChild(messageText);
    addMessageMeta(bubble, '✓ Sent · demo', true);
    chatMessages.appendChild(bubble);
    const detectedAnimation = detectAutoAnimation(value);
    if (detectedAnimation) showAutoAnimation(detectedAnimation);
    chatInput.value = '';
    chatInput.focus({ preventScroll: true });
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulated state changes are deliberately labeled DEMO, not real receipts.
    const status = bubble.querySelector('.message-status');
    window.setTimeout(() => {
      if (status) status.textContent = '✓✓ Delivered · demo';
    }, 900);
    window.setTimeout(() => {
      if (status) status.textContent = '✓✓ Seen · demo';
    }, 2300);

    // Show Typing… in the same header line as Online, then restore Online.
    setChatPresence(true);
    window.setTimeout(() => {
      const reply = document.createElement('div');
      reply.className = 'chat-bubble received';
      const replyText = document.createElement('div');
      replyText.textContent = 'Message received in this local preview. 👋';
      reply.appendChild(replyText);
      addMessageMeta(reply, '', false);
      chatMessages.appendChild(reply);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      setChatPresence(false);
      if (chatInput) chatInput.focus({ preventScroll: true });
    }, 1400);
  });


  // Local-only previews for the two approved chat games. Cross-device turns and
  // invitation delivery require the Supabase Realtime game-session backend.
  let selectedGame = 'ttt';
  let boardState = Array(9).fill('');
  let gameTurn = 'X';
  let wordItems = ['ABAROX'];
  function selectGame(which) {
    selectedGame = which;
    document.querySelectorAll('.game-choice').forEach(b => b.classList.toggle('active', b.dataset.game === which));
    document.getElementById('ticTacToeBoard').hidden = which !== 'ttt';
    document.getElementById('wordGamePanel').hidden = which !== 'word';
    document.getElementById('gameStatus').textContent = which === 'ttt' ? 'Tic-Tac-Toe · local preview' : 'Word Game · local preview';
  }
  function resetGames() {
    boardState = Array(9).fill(''); gameTurn = 'X';
    document.querySelectorAll('[data-cell]').forEach(b => b.textContent = '');
    wordItems = ['ABAROX']; document.getElementById('wordChain').textContent = wordItems.join(' · ');
    document.getElementById('gameStatus').textContent = 'Game reset · local preview';
  }
  function playCell(index) {
    if (boardState[index]) return;
    boardState[index] = gameTurn;
    const button = document.querySelector('[data-cell="' + index + '"]');
    if (button) button.textContent = gameTurn;
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const won = wins.some(line => line.every(i => boardState[i] === gameTurn));
    if (won) document.getElementById('gameStatus').textContent = gameTurn + ' wins · local preview';
    else if (boardState.every(Boolean)) document.getElementById('gameStatus').textContent = 'Draw · local preview';
    else { gameTurn = gameTurn === 'X' ? 'O' : 'X'; document.getElementById('gameStatus').textContent = 'Turn: ' + gameTurn + ' · local preview'; }
  }
  const wordForm = document.getElementById('wordForm');
  if (wordForm) wordForm.addEventListener('submit', e => {
    e.preventDefault(); const input = document.getElementById('wordInput'); const word = input.value.trim();
    if (!word) return; wordItems.push(word); document.getElementById('wordChain').textContent = wordItems.join(' · '); input.value = '';
  });
  selectGame('ttt');

})();
