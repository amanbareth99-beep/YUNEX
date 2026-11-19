(() => {
  'use strict';

  const views = Array.from(document.querySelectorAll('.view'));
  const tabs = document.querySelector('.tabs');
  let currentView = 'feed';
  let activeDemoUser = { name: 'Riya Creates', handle: '@riya_demo' };
  let exitWarningAt = 0;
  let chatKeyboardHistoryEntry = false;

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

  // Founder cover: pull down to reveal the full branded cover; swipe up to tuck it behind the profile.
  const founderView = document.getElementById('profile');
  const founderCover = document.getElementById('founderCover');
  if (founderCover && founderView) {
    let coverTouchStartY = 0;
    let coverTouchStartX = 0;
    founderCover.addEventListener('touchstart', event => { const t=event.touches[0]; coverTouchStartY=t.clientY; coverTouchStartX=t.clientX; }, {passive:true});
    founderCover.addEventListener('touchend', event => { const t=event.changedTouches[0]; const dy=t.clientY-coverTouchStartY; const dx=Math.abs(t.clientX-coverTouchStartX); if (Math.abs(dy)>32 && Math.abs(dy)>dx) founderView.classList.toggle('cover-expanded', dy>0); }, {passive:true});
    const toggleCover = () => founderView.classList.toggle('cover-expanded');
    founderCover.addEventListener('click', toggleCover);
    founderCover.addEventListener('keydown', event => { if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleCover();} });
  }

  // Start with a clean Home Feed history entry.
  history.replaceState({ yunex: true, view: 'feed' }, '', location.pathname + location.search);
  renderView('feed');

  // All internal navigation uses one delegated handler, including dynamically shown controls.
  document.addEventListener('click', event => {
    const profileButton = event.target.closest('.profile-open');
    if (profileButton) {
      activeDemoUser = {
        name: profileButton.dataset.user || 'YUNEX Creator',
        handle: profileButton.dataset.handle || '@creator_demo'
      };
      document.getElementById('demoName').textContent = activeDemoUser.name;
      document.getElementById('demoHandle').textContent = activeDemoUser.handle;
      document.getElementById('demoAvatar').textContent =
        activeDemoUser.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      document.getElementById('chatName').textContent = activeDemoUser.name;
      document.getElementById('chatAvatar').textContent = activeDemoUser.name[0].toUpperCase();
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
      document.getElementById('chatAvatar').textContent = activeDemoUser.name[0].toUpperCase();
      navigate('chat');
      return;
    }

    if (event.target.closest('#hugButton')) {
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble sent hug-message';
      bubble.textContent = '🤗 Hug sent · demo';
      addMessageMetaSafe(bubble);
      document.getElementById('chatMessages').appendChild(bubble);
      document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
      return;
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

  const demoRegister = document.getElementById('demoRegister');
  if (demoRegister) demoRegister.addEventListener('click', () => {
    alert('YUNEX registration screen preview only. Backend authentication is not connected yet. Do not enter real credentials.');
  });

  document.querySelectorAll('.category-grid button').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('exploreSearch').value = button.innerText.replace(/[^\w\s]/g, '').trim();
    });
  });

  // Chat status preview: all delivery/read states below are simulated locally.
  // Real Sent/Delivered/Seen receipts require authenticated Supabase messaging.
  // Founder profile: editable local preview. Real identity/permissions remain server-controlled.
  const founderDefaults = { name: 'Aman Bareth', handle: '@amanbareth', bio: 'Building YUNEX — a place to connect, create and win. 🚀' };
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
    const avatar = document.getElementById('profileShortcut');
    if (avatar && !avatar.querySelector('img')) avatar.textContent = founderProfile.name.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
    const photo = document.getElementById('founderPhoto');
    if (photo && !photo.querySelector('img')) photo.textContent = founderProfile.name.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
  }
  paintFounderProfile();
  const editFounderButton = document.getElementById('editFounderProfile');
  if (editFounderButton) editFounderButton.addEventListener('click', () => {
    document.getElementById('editFounderName').value = founderProfile.name;
    document.getElementById('editFounderHandle').value = founderProfile.handle.replace(/^@/, '');
    document.getElementById('editFounderBio').value = founderProfile.bio;
    founderEditOverlay.hidden = false;
  });
  const closeFounderEdit = document.getElementById('closeFounderEdit');
  if (closeFounderEdit) closeFounderEdit.addEventListener('click', () => { founderEditOverlay.hidden = true; });
  if (founderEditOverlay) founderEditOverlay.addEventListener('click', event => { if (event.target === founderEditOverlay) founderEditOverlay.hidden = true; });
  const founderEditForm = document.getElementById('founderEditForm');
  if (founderEditForm) founderEditForm.addEventListener('submit', event => {
    event.preventDefault();
    founderProfile = {
      name: document.getElementById('editFounderName').value.trim() || founderDefaults.name,
      handle: '@' + document.getElementById('editFounderHandle').value.trim().replace(/^@/, '').replace(/\s+/g, '').toLowerCase(),
      bio: document.getElementById('editFounderBio').value.trim()
    };
    try { localStorage.setItem('yunexFounderProfile', JSON.stringify(founderProfile)); } catch (_) {}
    paintFounderProfile();
    founderEditOverlay.hidden = true;
  });
  const founderPhotoInput = document.getElementById('founderPhotoInput');
  if (founderPhotoInput) founderPhotoInput.addEventListener('change', () => {
    const file = founderPhotoInput.files && founderPhotoInput.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photo = document.getElementById('founderPhoto');
      photo.textContent = '';
      const img = document.createElement('img');
      img.src = reader.result;
      img.alt = 'Founder profile photo';
      photo.appendChild(img);
      try { localStorage.setItem('yunexFounderPhoto', reader.result); } catch (_) {}
    };
    reader.readAsDataURL(file);
  });
  try {
    const savedPhoto = localStorage.getItem('yunexFounderPhoto');
    if (savedPhoto) {
      const photo = document.getElementById('founderPhoto');
      photo.textContent = '';
      const img = document.createElement('img'); img.src = savedPhoto; img.alt = 'Founder profile photo'; photo.appendChild(img);
    }
  } catch (_) {}
  document.querySelectorAll('[data-profile-tab]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('[data-profile-tab]').forEach(item => item.classList.toggle('selected', item === tab));
    const labels = { posts: ['No posts yet', 'Your photos and videos will appear here.'], reels: ['No reels yet', 'Your published videos will appear here.'], tagged: ['No tagged posts', 'Posts you are tagged in will appear here.'] };
    const copy = labels[tab.dataset.profileTab];
    document.getElementById('founderEmptyTitle').textContent = copy[0];
    document.getElementById('founderEmptyText').textContent = copy[1];
  }));
  const shareFounderButton = document.getElementById('shareFounderProfile');
  if (shareFounderButton) shareFounderButton.addEventListener('click', async () => {
    const shareText = `${founderProfile.name} ${founderProfile.handle} · YUNEX Founder`;
    try {
      if (navigator.share) await navigator.share({ title: 'YUNEX Founder', text: shareText, url: location.href.split('#')[0] + '#profile' });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(shareText + ' · ' + location.href.split('#')[0] + '#profile'); shareFounderButton.textContent = 'Copied!'; }
      else shareFounderButton.textContent = 'Share unavailable';
    } catch (_) {}
  });
  const founderSettingsButton = document.getElementById('founderSettings');
  if (founderSettingsButton) founderSettingsButton.addEventListener('click', () => { alert('Profile privacy and account settings will be connected in the Settings phase.'); });

  const chatForm = document.getElementById('chatForm');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const typingIndicator = document.getElementById('typingIndicator');

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
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulated state changes are deliberately labeled DEMO, not real receipts.
    const status = bubble.querySelector('.message-status');
    window.setTimeout(() => {
      if (status) status.textContent = '✓✓ Delivered · demo';
    }, 900);
    window.setTimeout(() => {
      if (status) status.textContent = '✓✓ Seen · demo';
    }, 2300);

    if (typingIndicator) {
      typingIndicator.hidden = false;
      window.setTimeout(() => {
        if (typingIndicator) typingIndicator.hidden = true;
        const reply = document.createElement('div');
        reply.className = 'chat-bubble received';
        const replyText = document.createElement('div');
        replyText.textContent = 'Message received in this local preview. 👋';
        reply.appendChild(replyText);
        addMessageMeta(reply, '', false);
        chatMessages.appendChild(reply);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1400);
    }
  });


  // Local-only previews for the two approved chat games. Cross-device turns and
  // invitation delivery require the Supabase Realtime game-session backend.
  let selectedGame = 'ttt';
  let boardState = Array(9).fill('');
  let gameTurn = 'X';
  let wordItems = ['YUNEX'];
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
    wordItems = ['YUNEX']; document.getElementById('wordChain').textContent = wordItems.join(' · ');
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
