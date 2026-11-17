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


  // Subtle local-demo chat effects. Realtime delivery requires backend integration.
  // The existing dedicated Hug button keeps its original local-preview behavior.
  const chatEffectPresets = { hug: { symbol: '🤗', label: 'A warm hug' } };
  function showChatEffect(effectName) {
    const preset = chatEffectPresets[effectName];
    const layer = document.getElementById('chatEffectLayer');
    if (!preset || !layer) return;
    const tray = document.getElementById('chatEffectsTray');
    const toggle = document.getElementById('chatEffectsToggle');
    if (tray) tray.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    layer.replaceChildren();
    const card = document.createElement('div');
    card.className = 'chat-effect-card';
    const symbol = document.createElement('div');
    symbol.className = 'chat-effect-symbol';
    symbol.textContent = preset.symbol;
    const caption = document.createElement('div');
    caption.className = 'chat-effect-caption';
    caption.textContent = preset.label;
    card.append(symbol, caption);
    layer.appendChild(card);
    window.setTimeout(() => {
      if (!card.isConnected) return;
      card.classList.add('is-leaving');
      window.setTimeout(() => card.remove(), 600);
    }, 1500);
  }


  // Automatic text-triggered cartoon scenes. This is a lightweight, self-contained
  // 2.5D SVG/CSS demo; real 3D assets and cross-device delivery belong to the backend phase.
  const cartoonTriggers = [
    { key: 'kiss', label: 'A little kiss', patterns: [/\bkiss\b/i, /\bmuah\b/i, /\bmwah\b/i, /😘/], art: 'kiss' },
    { key: 'love', label: 'Love You', patterns: [/\blove\s+you\b/i, /\blove\s+u\b/i, /\bluv\s+u\b/i, /❤️/], art: 'love' },
    { key: 'miss', label: 'Miss You', patterns: [/\bmiss\s+you\b/i, /\bmiss\s+u\b/i, /🥺/], art: 'miss' },
    { key: 'laugh', label: 'Laugh', patterns: [/\bhaha+\b/i, /\blol\b/i, /\blmao\b/i, /😂/], art: 'laugh' },
    { key: 'cry', label: 'Cry', patterns: [/\bcry(?:ing)?\b/i, /\bsobbing\b/i, /😭/], art: 'cry' },
    { key: 'horror', label: 'Horror', patterns: [/\bhorror\b/i, /\bboo\b/i, /\bscary\b/i, /\bghost\b/i, /👻/], art: 'horror' }
  ];
  function detectCartoonTrigger(message) {
    const found = cartoonTriggers.find(item => item.patterns.some(pattern => pattern.test(message)));
    return found || null;
  }
  function cartoonArtwork(kind) {
    const common = `<defs>
      <linearGradient id="skin" x2="0" y2="1"><stop stop-color="#ffe2c4"/><stop offset="1" stop-color="#d99b78"/></linearGradient>
      <linearGradient id="blue" x2="0" y2="1"><stop stop-color="#8be4ff"/><stop offset="1" stop-color="#2775c8"/></linearGradient>
      <linearGradient id="pink" x2="0" y2="1"><stop stop-color="#ffb7d5"/><stop offset="1" stop-color="#bd5d98"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="#4aaeff" stop-opacity=".34"/><stop offset="1" stop-color="#4aaeff" stop-opacity="0"/></radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs><ellipse cx="160" cy="178" rx="116" ry="13" fill="#000" opacity=".35" filter="url(#shadow)"/><ellipse cx="160" cy="104" rx="145" ry="94" fill="url(#glow)"/>`;
    const head=(x,y,color='url(#skin)')=>`<circle cx="${x}" cy="${y}" r="28" fill="${color}" stroke="#f8d9c6" stroke-width="2"/><path d="M${x-25} ${y-9}q5-26 27-21q19 4 24 22q-14-10-25-9q-14 0-26 8" fill="#26334d"/><ellipse cx="${x-9}" cy="${y+2}" rx="2.5" ry="4" fill="#26334d"/><ellipse cx="${x+9}" cy="${y+2}" rx="2.5" ry="4" fill="#26334d"/><path d="M${x-6} ${y+14}q6 6 12 0" fill="none" stroke="#a85f63" stroke-width="2" stroke-linecap="round"/>`;
    const body=(x,y,color='url(#blue)')=>`<path d="M${x-31} ${y+65}q0-44 31-44t31 44z" fill="${color}" stroke="#b9eaff" stroke-width="2"/>`;
    let scene='';
    if(kind==='kiss') scene=`<g class="toon-left">${body(108,74)}${head(108,57)}</g><g class="toon-right">${body(213,74,'url(#pink)')}${head(213,57)}</g><path class="toon-heart" d="M155 75c-19-17-36 10 0 32c36-22 19-49 0-32z" fill="#ff7daf" stroke="#ffd5e5" stroke-width="2"/><path d="M139 55q-10-12 2-16m37 13q12-13 20-4" fill="none" stroke="#8bdcff" stroke-width="3" stroke-linecap="round"/>`;
    if(kind==='love') scene=`<g class="toon-left">${body(108,74)}${head(108,57)}</g><g class="toon-right">${body(213,74,'url(#pink)')}${head(213,57)}</g><path class="toon-heart" d="M160 77c-24-22-45 13 0 43c45-30 24-65 0-43z" fill="#ff6e9e" stroke="#ffd1e1" stroke-width="3"/><path d="M76 40l5-9m158 9l-5-9" stroke="#8bdcff" stroke-width="3" stroke-linecap="round"/>`;
    if(kind==='miss') scene=`<g class="toon-solo">${body(160,73)}${head(160,56)}</g><path class="toon-heart" d="M220 55c-15-14-29 8 0 27c29-19 15-41 0-27z" fill="#ff85b6"/><path d="M95 55q-16-12-23 3m7 13q-15 5-18 18" fill="none" stroke="#91dfff" stroke-width="3" stroke-linecap="round"/><circle cx="203" cy="110" r="5" fill="#83d8ff" opacity=".8"/>`;
    if(kind==='laugh') scene=`<g class="toon-left">${body(108,74)}${head(108,57)}</g><g class="toon-right">${body(213,74,'url(#pink)')}${head(213,57)}</g><path d="M94 61q14 13 28 0m77 0q14 13 28 0" fill="none" stroke="#26334d" stroke-width="4" stroke-linecap="round"/><path d="M73 38l-8-8m130 0l8-8m28 20l9-6" stroke="#ffd36f" stroke-width="4" stroke-linecap="round"/><g class="toon-bubble"><circle cx="160" cy="36" r="17" fill="#173d68" stroke="#7bd7ff" stroke-width="2"/><path d="M151 35q9-13 18 0q-9 15-18 0" fill="#b5efff"/></g>`;
    if(kind==='cry') scene=`<g class="toon-solo">${body(160,73,'url(#blue)')}${head(160,56)}</g><path class="toon-tear" d="M139 68q-9 13 0 17q9-4 0-17zm42 0q-9 13 0 17q9-4 0-17z" fill="#75d8ff"/><path d="M149 79q11-8 22 0" fill="none" stroke="#a85f63" stroke-width="2.5" stroke-linecap="round"/><path d="M96 55q-10-10-17 0m97-24q8-10 16 0" fill="none" stroke="#8bdcff" stroke-width="3"/>`;
    if(kind==='horror') scene=`<g class="toon-solo">${body(160,73)}${head(160,56)}</g><g class="toon-ghost"><path d="M207 124V82q0-29 25-29t25 29v42l-12-9-13 10-13-10z" fill="#d9f4ff" stroke="#7fcfff" stroke-width="3"/><ellipse cx="224" cy="82" rx="3" ry="5" fill="#243653"/><ellipse cx="241" cy="82" rx="3" ry="5" fill="#243653"/><ellipse cx="233" cy="97" rx="5" ry="6" fill="#8b6d91"/></g><path d="M88 35l-8-8m99 1l8-8m-100 40l-9 1" stroke="#b8eaff" stroke-width="3" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 320 190" role="img" aria-label="${kind} cartoon animation" xmlns="http://www.w3.org/2000/svg">${common}${scene}</svg>`;
  }
  function showAutomaticCartoon(trigger) {
    const layer = document.getElementById('chatEffectLayer');
    if (!trigger || !layer) return;
    layer.replaceChildren();
    const card = document.createElement('div');
    card.className = `chat-effect-card cartoon-card cartoon-${trigger.key}`;
    const art = document.createElement('div'); art.className = 'cartoon-art';
    art.innerHTML = cartoonArtwork(trigger.art);
    const caption = document.createElement('div'); caption.className = 'chat-effect-caption'; caption.textContent = trigger.label;
    card.append(art, caption); layer.appendChild(card);
    window.setTimeout(() => { if (!card.isConnected) return; card.classList.add('is-leaving'); window.setTimeout(() => card.remove(), 250); }, 1750);
  }

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
      showChatEffect('hug');
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
  const chatForm = document.getElementById('chatForm');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatPresence = document.getElementById('chatPresence');
  const presenceLabel = chatPresence ? chatPresence.querySelector('.presence-label') : null;

  function setChatPresence(isTyping) {
    if (!chatPresence || !presenceLabel) return;
    presenceLabel.textContent = isTyping ? 'Typing…' : 'Online';
    chatPresence.classList.toggle('is-typing', isTyping);
    chatPresence.classList.toggle('is-online', !isTyping);
  }

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
    const automaticEffect = detectCartoonTrigger(value);
    if (automaticEffect) showAutomaticCartoon(automaticEffect);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Keep the composer focused after Send so Android can type the next message immediately.
    window.setTimeout(() => {
      if (document.getElementById('chat')?.classList.contains('active')) {
        try { chatInput.focus({ preventScroll: true }); } catch (_) { chatInput.focus(); }
        if (typeof syncVisibleViewport === 'function') syncVisibleViewport();
      }
    }, 60);

    // Simulated state changes are deliberately labeled DEMO, not real receipts.
    const status = bubble.querySelector('.message-status');
    window.setTimeout(() => {
      if (status) status.textContent = '✓✓ Delivered · demo';
    }, 900);
    window.setTimeout(() => {
      if (status) status.textContent = '✓✓ Seen · demo';
    }, 2300);

    // Demo presence appears under the chat partner's name, not in the message list.
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
    }, 1400);
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

  // Chat deletion controls are local-demo interactions. A real multi-device
  // delete-for-everyone action must be enforced by the authenticated backend.
  const chatMenuTrigger = document.getElementById('chatMenuTrigger');
  const chatOptionsMenu = document.getElementById('chatOptionsMenu');
  const messageActionsOverlay = document.getElementById('messageActionsOverlay');
  const messageActionsPreview = document.getElementById('messageActionsPreview');
  let activeMessageBubble = null;

  function closeChatMenus() {
    if (chatOptionsMenu) chatOptionsMenu.hidden = true;
    if (messageActionsOverlay) messageActionsOverlay.hidden = true;
    activeMessageBubble = null;
  }
  if (chatMenuTrigger && chatOptionsMenu) {
    chatMenuTrigger.addEventListener('click', () => {
      chatOptionsMenu.hidden = !chatOptionsMenu.hidden;
    });
  }
  if (chatMessages && messageActionsOverlay) {
    chatMessages.addEventListener('click', event => {
      const bubble = event.target.closest('.chat-bubble');
      if (!bubble) return;
      activeMessageBubble = bubble;
      const textNode = bubble.querySelector(':scope > div');
      const message = textNode ? textNode.textContent : 'Selected message';
      messageActionsPreview.textContent = message.length > 120 ? message.slice(0, 117) + '…' : message;
      messageActionsOverlay.hidden = false;
    });
    chatMessages.addEventListener('contextmenu', event => {
      const bubble = event.target.closest('.chat-bubble');
      if (!bubble) return;
      event.preventDefault();
      activeMessageBubble = bubble;
      const textNode = bubble.querySelector(':scope > div');
      messageActionsPreview.textContent = textNode ? textNode.textContent : 'Selected message';
      messageActionsOverlay.hidden = false;
    });
  }
  document.querySelectorAll('[data-message-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.messageAction;
      if (action === 'cancel') { closeChatMenus(); return; }
      if (!activeMessageBubble) { closeChatMenus(); return; }
      const label = action === 'everyone' ? 'Delete this message for everyone?' : 'Delete this message for you?';
      if (window.confirm(label)) {
        if (action === 'everyone') {
          const replacement = document.createElement('div');
          replacement.className = 'chat-bubble deleted-message';
          replacement.textContent = 'This message was deleted';
          activeMessageBubble.replaceWith(replacement);
        } else {
          activeMessageBubble.remove();
        }
      }
      closeChatMenus();
    });
  });
  document.querySelectorAll('[data-chat-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.chatAction;
      if (action === 'clear') {
        if (window.confirm('Clear all messages from this chat on your side?')) {
          chatMessages.replaceChildren();
        }
      } else if (action === 'delete') {
        if (window.confirm('Delete this chat from your chat list? This demo will clear the conversation and return to Profile.')) {
          chatMessages.replaceChildren();
          closeChatMenus();
          renderView('profile');
          return;
        }
      }
      closeChatMenus();
    });
  });
  if (messageActionsOverlay) {
    messageActionsOverlay.addEventListener('click', event => {
      if (event.target === messageActionsOverlay) closeChatMenus();
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeChatMenus();
  });

  selectGame('ttt');

})();
