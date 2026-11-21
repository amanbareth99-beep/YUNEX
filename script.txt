(() => {
  'use strict';

  const views = Array.from(document.querySelectorAll('.view'));
  const tabs = document.querySelector('.tabs');
  let currentView = 'feed';
  let activeDemoUser = { name: 'Riya Creates', handle: '@riya_demo' };
  let exitWarningAt = 0;
  let chatKeyboardHistoryEntry = false;

  // One avatar renderer is shared by every place a profile appears.
  function profilePhotoKey(key) { return key === 'founder' ? 'yunexFounderPhoto' : `yunexProfilePhoto:${key.replace(/^user:/, '')}`; }
  function renderProfileAvatar(element, key, fallbackText) {
    if (!element || !key) return;
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
        name: profileButton.dataset.user || 'YUNEX Creator',
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
  const founderSettingsButton = document.getElementById('founderSettings');
  const founderPhotoInput=document.getElementById('founderPhotoInput'),photoAdjustOverlay=document.getElementById('photoAdjustOverlay'),photoAdjustPreview=document.getElementById('photoAdjustPreview');
  let pendingPhotoData='',photoTransform={zoom:1,x:50,y:50};

  function paintPhotoPreview(){
    if(photoAdjustPreview){
      photoAdjustPreview.style.objectPosition=`${photoTransform.x}% ${photoTransform.y}%`;
      photoAdjustPreview.style.transform=`scale(${photoTransform.zoom}) rotate(${photoTransform.rotation||0}deg)`;
    }
  }
  function applyFounderPhoto(data,t=photoTransform){
    const photo=document.getElementById('founderPhoto'); if(!photo)return;
    photo.innerHTML=''; const img=document.createElement('img'); img.className='profile-avatar-image'; img.src=data; img.alt='Founder profile photo';
    img.style.objectPosition=`${t.x}% ${t.y}%`; img.style.transform=`scale(${t.zoom}) rotate(${t.rotation||0}deg)`; photo.appendChild(img);
    try{localStorage.setItem('yunexFounderPhoto',data);localStorage.setItem('yunexFounderPhotoTransform',JSON.stringify(t));}catch(_){}
    refreshAllProfileAvatars();
    const headerAvatar=document.getElementById('profileShortcut');
    if(headerAvatar) renderProfileAvatar(headerAvatar,'founder','AB');
    const profileNavAvatar=document.querySelector('.profile-nav-avatar');
    if(profileNavAvatar) renderProfileAvatar(profileNavAvatar,'founder','AB');
  }
  if(founderPhotoInput)founderPhotoInput.addEventListener('change',()=>{
    const file=founderPhotoInput.files&&founderPhotoInput.files[0]; if(!file||!file.type.startsWith('image/'))return;
    const reader=new FileReader(); reader.onload=()=>{pendingPhotoData=String(reader.result||'');photoTransform={zoom:1,x:50,y:50,rotation:0};if(photoAdjustPreview)photoAdjustPreview.src=pendingPhotoData;paintPhotoPreview();if(photoAdjustOverlay)photoAdjustOverlay.hidden=false;}; reader.readAsDataURL(file); founderPhotoInput.value='';
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
        photoTransform.x=Math.max(0,Math.min(100,gestureStart.px+(e.clientX-gestureStart.x)/rect.width*100));
        photoTransform.y=Math.max(0,Math.min(100,gestureStart.py+(e.clientY-gestureStart.y)/rect.height*100));
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
  const closePhotoAdjust=document.getElementById('closePhotoAdjust');if(closePhotoAdjust)closePhotoAdjust.addEventListener('click',()=>{photoAdjustOverlay.hidden=true;pendingPhotoData='';});
  if(photoAdjustOverlay)photoAdjustOverlay.addEventListener('click',e=>{if(e.target===photoAdjustOverlay){photoAdjustOverlay.hidden=true;pendingPhotoData='';}});
  const savePhotoAdjust=document.getElementById('savePhotoAdjust');if(savePhotoAdjust)savePhotoAdjust.addEventListener('click',()=>{if(pendingPhotoData)applyFounderPhoto(pendingPhotoData,photoTransform);pendingPhotoData='';photoAdjustOverlay.hidden=true;});
  try{const saved=localStorage.getItem('yunexFounderPhoto');if(saved){try{photoTransform={...photoTransform,...JSON.parse(localStorage.getItem('yunexFounderPhotoTransform')||'{}')};}catch(_){}applyFounderPhoto(saved,photoTransform);}}catch(_){}
  const founderPhoto=document.getElementById('founderPhoto'),photoLightbox=document.getElementById('founderPhotoLightbox'),photoLarge=document.getElementById('founderPhotoLarge');let photoHoldTimer=null,photoHoldFired=false;
  if(founderPhoto&&photoLightbox){
    founderPhoto.addEventListener('contextmenu',e=>e.preventDefault());
    founderPhoto.addEventListener('dragstart',e=>e.preventDefault());
    founderPhoto.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;photoHoldFired=false;clearTimeout(photoHoldTimer);photoHoldTimer=setTimeout(()=>{const image=founderPhoto.querySelector('img');if(!image)return;photoHoldFired=true;photoLarge.src=image.src;photoLarge.style.objectPosition=image.style.objectPosition||'50% 50%';photoLarge.style.transform='none';photoLightbox.hidden=false;},2000);});
    ['pointerup','pointerleave','pointercancel'].forEach(t=>founderPhoto.addEventListener(t,()=>clearTimeout(photoHoldTimer)));
    photoLightbox.addEventListener('click',()=>{photoLightbox.hidden=true;});photoLightbox.addEventListener('contextmenu',e=>e.preventDefault());
  }
  const founderDatesOverlay=document.getElementById('founderDatesOverlay');let founderDates={birthday:'',birthdayAlerts:false,specialDays:[]};try{founderDates={...founderDates,...JSON.parse(localStorage.getItem('yunexFounderDates')||'{}')};}catch(_){}
  function renderSpecialDays(){const list=document.getElementById('specialDaysList');if(!list)return;list.innerHTML='';founderDates.specialDays.forEach((d,i)=>{const row=document.createElement('div');row.className='special-day-item';const info=document.createElement('span');info.textContent=`${d.title} · ${d.date} · ${d.time}`;const rm=document.createElement('button');rm.type='button';rm.textContent='Remove';rm.addEventListener('click',()=>{founderDates.specialDays.splice(i,1);renderSpecialDays();});row.append(info,rm);list.appendChild(row);});}
  function openFounderDates(){document.getElementById('founderBirthday').value=founderDates.birthday||'';document.getElementById('founderBirthdayAlerts').checked=!!founderDates.birthdayAlerts;const privacy=JSON.parse(localStorage.getItem('yunexAccountPrivacy')||'{}');document.getElementById('privateAccountToggle').checked=!!privacy.isPrivate;document.getElementById('manualTagApproval').checked=privacy.manualTagApproval!==false;renderSpecialDays();founderDatesOverlay.hidden=false;}
  if(founderSettingsButton)founderSettingsButton.addEventListener('click',openFounderDates);const closeFounderDates=document.getElementById('closeFounderDates');if(closeFounderDates)closeFounderDates.addEventListener('click',()=>founderDatesOverlay.hidden=true);if(founderDatesOverlay)founderDatesOverlay.addEventListener('click',e=>{if(e.target===founderDatesOverlay)founderDatesOverlay.hidden=true;});
  const addSpecialDay=document.getElementById('addSpecialDay');if(addSpecialDay)addSpecialDay.addEventListener('click',()=>{const title=document.getElementById('specialDayTitle').value.trim(),date=document.getElementById('specialDayDate').value,time=document.getElementById('specialDayTime').value||'09:00';if(!title||!date){alert('Special day name aur date dono bharo.');return;}founderDates.specialDays.push({title,date,time});document.getElementById('specialDayTitle').value='';document.getElementById('specialDayDate').value='';renderSpecialDays();});
  const saveFounderDates=document.getElementById('saveFounderDates');if(saveFounderDates)saveFounderDates.addEventListener('click',()=>{founderDates.birthday=document.getElementById('founderBirthday').value;founderDates.birthdayAlerts=document.getElementById('founderBirthdayAlerts').checked;const privacy={isPrivate:document.getElementById('privateAccountToggle').checked,manualTagApproval:document.getElementById('manualTagApproval').checked};try{localStorage.setItem('yunexFounderDates',JSON.stringify(founderDates));localStorage.setItem('yunexAccountPrivacy',JSON.stringify(privacy));}catch(_){}founderDatesOverlay.hidden=true;alert('Profile settings is browser preview mein save ho gayi hain. Secure privacy enforcement ke liye backend/RLS connect karna zaroori hai.');});
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

  const shareFounderButton = document.getElementById('shareFounderProfile');
  if (shareFounderButton) shareFounderButton.addEventListener('click', async () => {
    const shareText = `${founderProfile.name} ${founderProfile.handle} · YUNEX Founder`;
    try {
      if (navigator.share) await navigator.share({ title: 'YUNEX Founder', text: shareText, url: location.href.split('#')[0] + '#profile' });
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
