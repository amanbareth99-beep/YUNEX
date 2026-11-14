(() => {
  'use strict';

  const views = Array.from(document.querySelectorAll('.view'));
  const tabs = document.querySelector('.tabs');
  const topbar = document.querySelector('.topbar');
  const footer = document.querySelector('footer');
  let currentView = 'feed';
  let activeDemoUser = { name: 'Riya Creates', handle: '@riya_demo' };
  let exitWarningAt = 0;

  // Chat layout refinements: full-height conversation, no visible in-app Back controls.
  const chatStyle = document.createElement('style');
  chatStyle.textContent = `
    body.section-open main { width:100%; max-width:none; margin:0 auto; padding:0 16px 18px; min-height:100dvh; }
    body.section-open .view.active { min-height:calc(100dvh - 18px); }
    body.section-open footer { display:none !important; }
    .section-back, #chat > button[data-view], #demoProfile > button[data-view], #account > .back-home { display:none !important; }
    #chat { display:flex; flex-direction:column; height:calc(100dvh - 16px); min-height:calc(100dvh - 16px); }
    #chat .chat-heading { display:flex; align-items:center; gap:10px; padding:10px 0 14px; border-bottom:1px solid #1e2b40; }
    #chat .chat-heading > div:last-child { display:flex; flex-direction:column; gap:0; }
    #chat .chat-heading .muted { display:none !important; }
    #chat .hug-action { margin-left:auto; min-width:54px; min-height:50px; padding:0 15px; border:1px solid #287bc5; border-radius:14px; color:#fff; background:linear-gradient(135deg,#0879f9,#25b9ff); font-size:22px; font-weight:800; box-shadow:0 5px 18px #168bff35; }
    #chat .chat-messages { flex:1; min-height:0; max-height:none; overflow-y:auto; margin:12px 0; }
    #chat .chat-compose { display:flex; gap:9px; margin:0 0 8px; padding-bottom:env(safe-area-inset-bottom); }
    #chat .chat-compose input { flex:1; min-width:0; min-height:52px; margin:0; }
    #chat .chat-compose button { min-width:76px; min-height:52px; padding:0 18px; font-size:14px; }
    #chat > p.tiny { display:none !important; }
    @media (min-width:720px) { body.section-open main { max-width:720px; } }
  `;
  document.head.appendChild(chatStyle);

  function prepareChatHeader() {
    const heading = document.querySelector('#chat .chat-heading');
    if (!heading) return;
    const oldSubtitle = heading.querySelector('small');
    if (oldSubtitle) oldSubtitle.remove();
    let hug = heading.querySelector('.hug-action');
    if (!hug) {
      hug = document.createElement('button');
      hug.type = 'button';
      hug.className = 'hug-action';
      hug.setAttribute('aria-label', 'Send a virtual hug request');
      hug.title = 'Send a Hug request';
      hug.textContent = '🤗';
      hug.addEventListener('click', () => {
        const accepted = window.confirm('Send a Virtual Hug request to ' + activeDemoUser.name + '?');
        if (accepted) window.alert('Hug request preview sent. Real-time delivery and Hug Back / Not Now require the connected YUNEX chat backend.');
      });
      heading.appendChild(hug);
    }
  }

  function renderView(id) {
    if (!document.getElementById(id)) id = 'feed';
    currentView = id;
    views.forEach(view => view.classList.toggle('active', view.id === id));
    document.querySelectorAll('.tab[data-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.view === id);
    });
    const isHome = id === 'feed';
    if (tabs) tabs.hidden = !isHome;
    if (topbar) topbar.hidden = !isHome;
    if (footer) footer.hidden = !isHome;
    document.body.classList.toggle('registration-open', id === 'account');
    document.body.classList.toggle('section-open', !isHome);

    // Approved navigation: use Android/browser system Back; never inject visible Back buttons.
    views.forEach(view => {
      view.querySelectorAll(':scope > button').forEach(button => {
        if (/back/i.test(button.textContent || '') || button.classList.contains('section-back') || button.classList.contains('back-home')) {
          button.remove();
        }
      });
    });
    if (id === 'chat') prepareChatHeader();
    window.scrollTo(0, 0);
  }

  function navigate(id) {
    if (!document.getElementById(id) || id === currentView) return;
    history.pushState({ yunex: true, view: id }, '', '#' + id);
    renderView(id);
  }

  history.replaceState({ yunex: true, view: 'feed' }, '', location.pathname + location.search);
  renderView('feed');

  document.addEventListener('click', event => {
    const profileButton = event.target.closest('.profile-open');
    if (profileButton) {
      activeDemoUser = {
        name: profileButton.dataset.user || 'YUNEX Creator',
        handle: profileButton.dataset.handle || '@creator_demo'
      };
      document.getElementById('demoName').textContent = activeDemoUser.name;
      document.getElementById('demoHandle').textContent = activeDemoUser.handle;
      document.getElementById('demoAvatar').textContent = activeDemoUser.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
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
    if (event.target.closest('#profileShortcut')) { navigate('profile'); return; }
    if (event.target.closest('.brand')) { event.preventDefault(); navigate('feed'); return; }
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
    const likeButton = event.target.closest('.like-btn');
    if (likeButton) {
      const liked = likeButton.classList.toggle('liked');
      likeButton.firstChild.textContent = liked ? '♥ ' : '♡ ';
      const label = likeButton.querySelector('span');
      if (label) label.textContent = liked ? 'Liked' : 'Like';
    }
  });

  window.addEventListener('popstate', event => {
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
    message.textContent = fileInput.files.length ? 'Local preview ready. This file has not been uploaded or published.' : 'Choose a photo or video first to preview it.';
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
  const chatForm = document.getElementById('chatForm');
  if (chatForm) chatForm.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    const value = input.value.trim();
    if (!value) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble sent';
    bubble.textContent = value;
    document.getElementById('chatMessages').appendChild(bubble);
    input.value = '';
    bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
