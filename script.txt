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
  const chatEffectPresets = {
    hug: { symbol: '🤗', label: 'A warm hug' }
  };
  function showChatEffect(effectName) {
    // The existing dedicated Hug button keeps its original lightweight preview behavior.
    if (effectName !== 'hug') return showCartoonEffect(effectName);
    const layer = document.getElementById('chatEffectLayer');
    if (!layer) return;
    const messageStream = document.getElementById('chatMessages');
    if (messageStream) messageStream.appendChild(layer);
    layer.replaceChildren();
    const card = document.createElement('div');
    card.className = 'chat-effect-card hug-effect-card';
    const symbol = document.createElement('div'); symbol.className = 'chat-effect-symbol'; symbol.textContent = '🤗';
    const caption = document.createElement('div'); caption.className = 'chat-effect-caption'; caption.textContent = 'A warm hug';
    card.append(symbol, caption); layer.appendChild(card);
    window.setTimeout(() => { if (card.isConnected) card.remove(); }, 1500);
  }
  const cartoonEffects = {
    kiss: { title: 'A little kiss', face: '😘', other: '🥰', motion: 'kiss' },
    love: { title: 'Love You', face: '💙', other: '💗', motion: 'love' },
    miss: { title: 'Missing you', face: '🥺', other: '💌', motion: 'miss' },
    laugh: { title: 'That’s hilarious!', face: '😄', other: '😂', motion: 'laugh' },
    cry: { title: 'Feeling emotional', face: '🥹', other: '💧', motion: 'cry' },
    horror: { title: 'Boo! A little spooky', face: '👻', other: '✨', motion: 'horror' }
  };
  function showCartoonEffect(name) {
    const preset = cartoonEffects[name], layer = document.getElementById('chatEffectLayer');
    if (!preset || !layer) return;
    const messageStream = document.getElementById('chatMessages');
    if (messageStream) messageStream.appendChild(layer);
    layer.replaceChildren();
    if (name === 'kiss') {
      const image = document.createElement('img');
      image.className = 'yunex-kiss-gif';
      image.src = 'assets/chat-animations/kiss-3d-transparent.gif';
      image.alt = 'Cute 3D cartoon couple sharing a kiss';
      layer.replaceChildren(image);
      window.setTimeout(() => { if (image.isConnected) image.remove(); }, 2000);
      return;
    }
    const scene = document.createElement('div'); scene.className = `yunex-cartoon-scene scene-${preset.motion}`;
    scene.setAttribute('role','status'); scene.setAttribute('aria-label',preset.title);
    const glow = document.createElement('div'); glow.className = 'cartoon-glow';
    const characterA = document.createElement('div'); characterA.className = 'cartoon-character character-a';
    const faceA = document.createElement('span'); faceA.className = 'cartoon-face'; faceA.textContent = preset.face;
    const characterB = document.createElement('div'); characterB.className = 'cartoon-character character-b';
    const faceB = document.createElement('span'); faceB.className = 'cartoon-face'; faceB.textContent = preset.other;
    const title = document.createElement('div'); title.className = 'cartoon-caption'; title.textContent = preset.title;
    characterA.appendChild(faceA); characterB.appendChild(faceB); scene.append(glow,characterA,characterB,title); layer.appendChild(scene);
    window.setTimeout(() => { if (scene.isConnected) scene.classList.add('cartoon-leave'); }, 1550);
    window.setTimeout(() => { if (scene.isConnected) scene.remove(); }, 2000);
  }
  function detectChatAnimation(message) {
    const raw = String(message || '').normalize('NFKC').toLowerCase();
    const text = raw.replace(/[“”"'`]/g,' ').replace(/[^\p{L}\p{N}\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,' ').replace(/\s+/g,' ').trim();
    if (!text) return null;
    // Avoid triggering on explicit negation or when the user is merely discussing a keyword.
    const negated = /\b(dont|don't|do not|never|mat|nahi|nahin|not|without|stop)\b/i;
    const quotedMention = /\b(word|meaning|spelling|example|type|typing|likh|matlab)\b/i;
    const rules = [
      ['kiss', /\b(kiss|kissi|kisi|kisse|kissing|muah|mwah|umaah|chumma)\b|चुम्मा|किस्सी|किस्स?ी|किस दे|किस देना|चूमना|चूम लो/i],
      ['love', /\b(i love you|love u|luv u|love you|luv you|i luv you|pyaar karta|pyaar karti|pyar karta|pyar karti)\b|तुमसे प्यार|लव यू|प्यार करता|प्यार करती/i],
      ['miss', /\b(i miss you|miss u|missing you|miss you|miss u so much|yaad aa rahi|yaad aa raha|teri yaad|tumhari yaad|yaad kar raha|yaad kar rahi)\b|याद आ रही|याद आ रहा|तुम्हारी याद|तेरी याद|मिस कर रहा|मिस कर रही|😞|🙁|☹️/i],
      ['laugh', /\b(haha+|hehe+|hihi+|lol|lmao|rofl|hasi aa gai|hasi aa gayi|hasna|hans raha|hans rahi)\b|हाहाहा|हा हा|हंसी आ गई|हँसी आ गई|मजेदार है|😂|🤣|😅/i],
      ['cry', /\b(cry|crying|tears|ro raha hu|ro rahi hu|rona aa raha|about to cry)\b|रोना आ रहा|रो रही हूँ|रो रहा हूँ|आँसू आ रहे|आंसू आ रहे|😭|😢|🥺/i],
      ['horror', /\b(ghost|horror|scared|afraid|dar lag|darr lag|bhoot|bhut|dar gaya|dar gayi)\b|डर लग रहा|डर गया|डर गई|भूत|डरावना|👻/i]
    ];
    for (const [effect, pattern] of rules) {
      const match = pattern.test(text);
      if (!match) continue;
      const matchedPart = text.match(pattern)?.[0] || '';
      const before = text.slice(Math.max(0,text.indexOf(matchedPart)-28), text.indexOf(matchedPart));
      if (negated.test(before) || (quotedMention.test(before) && !/\b(i|me|you|tum|mujhe|mujhko|please|plz)\b/i.test(before))) continue;
      return effect;
    }
    return null;
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
  const chatGalleryButton = document.getElementById('chatGalleryButton');
  const chatGalleryInput = document.getElementById('chatGalleryInput');
  const chatAttachmentPreview = document.getElementById('chatAttachmentPreview');
  let pendingChatMedia = [];
  function renderChatMediaPreview() {
    if (!chatAttachmentPreview) return;
    chatAttachmentPreview.replaceChildren();
    chatAttachmentPreview.hidden = pendingChatMedia.length === 0;
    pendingChatMedia.forEach((file,index) => {
      const item = document.createElement('div'); item.className='chat-attachment-thumb';
      const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
      media.src = URL.createObjectURL(file); if (media.tagName === 'VIDEO') media.muted = true;
      item.appendChild(media);
      const remove = document.createElement('button'); remove.type='button'; remove.textContent='×'; remove.setAttribute('aria-label','Remove selected file');
      remove.addEventListener('click',()=>{ pendingChatMedia.splice(index,1); renderChatMediaPreview(); });
      item.appendChild(remove); chatAttachmentPreview.appendChild(item);
    });
  }
  if (chatGalleryButton && chatGalleryInput) {
    chatGalleryButton.addEventListener('click',()=>chatGalleryInput.click());
    chatGalleryInput.addEventListener('change',()=>{
      const selected = Array.from(chatGalleryInput.files || []).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
      pendingChatMedia = pendingChatMedia.concat(selected).slice(0,10);
      renderChatMediaPreview(); chatGalleryInput.value='';
    });
  }
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
    if (!value && pendingChatMedia.length === 0) return;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble sent';
    const messageText = document.createElement('div');
    messageText.textContent = value;
    if (value) bubble.appendChild(messageText);
    pendingChatMedia.forEach(file => {
      const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
      media.className='chat-message-media'; media.src=URL.createObjectURL(file);
      if (media.tagName === 'VIDEO') { media.controls=true; media.playsInline=true; }
      media.alt = file.name; bubble.appendChild(media);
    });
    addMessageMeta(bubble, '✓ Sent · local demo', true);
    const detectedEffect = detectChatAnimation(value);
    pendingChatMedia = []; renderChatMediaPreview();
    chatMessages.appendChild(bubble);
    if (detectedEffect) showCartoonEffect(detectedEffect);
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
      replyText.textContent = 'Local demo reply. Media/messages are not delivered to another account yet. 👋';
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
