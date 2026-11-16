(() => {
  'use strict';

  const views = Array.from(document.querySelectorAll('.view'));
  const tabs = document.querySelector('.tabs');
  let currentView = 'feed';
  let activeDemoUser = { name: 'Riya Creates', handle: '@riya_demo' };
  let exitWarningAt = 0;

  function renderView(id) {
    if (!document.getElementById(id)) id = 'feed';
    currentView = id;
    views.forEach(view => view.classList.toggle('active', view.id === id));
    document.querySelectorAll('.tab[data-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.view === id);
    });
    if (tabs) tabs.hidden = (id === 'account');
    document.body.classList.toggle('registration-open', id === 'account');
    document.body.classList.toggle('chat-open', id === 'chat');
    window.scrollTo(0, 0);
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
  const typingIndicator = document.getElementById('typingIndicator');

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


  // Chat-only local game preview. A real two-device match needs Supabase Realtime.
  const gamesPanel = document.getElementById('gamesPanel');
  const gamesButton = document.getElementById('gamesButton');
  const gameFeedback = document.getElementById('gameFeedback');
  const inviteBox = document.getElementById('gameInvite');
  let selectedGame = null, board = Array(9).fill(''), playerTurn = 'X', wordTurnUser = 'You';
  let yourScore = 0, friendScore = 0, usedWords = new Set();
  const tttBoard = document.getElementById('ticTacToeBoard');
  const wordArea = document.getElementById('wordGameArea');
  if (gamesButton) gamesButton.addEventListener('click', () => { gamesPanel.hidden = !gamesPanel.hidden; });
  document.getElementById('closeGames')?.addEventListener('click', () => { gamesPanel.hidden = true; });
  document.querySelectorAll('.game-choice').forEach(button => button.addEventListener('click', () => {
    selectedGame = button.dataset.game; inviteBox.hidden = false; tttBoard.hidden = true; wordArea.hidden = true;
    document.getElementById('gameInviteText').textContent = `${selectedGame === 'ttt' ? 'Tic-Tac-Toe' : 'Word Game'} invitation sent to ${activeDemoUser.name}. Accept the invitation to start (local preview).`;
    gameFeedback.textContent = 'Waiting for the other player to accept…';
  }));
  document.getElementById('declineGame')?.addEventListener('click', () => { inviteBox.hidden = true; gameFeedback.textContent = 'Game invitation declined.'; });
  function renderBoard(){
    tttBoard.innerHTML='';
    board.forEach((mark,i)=>{const cell=document.createElement('button');cell.type='button';cell.className='ttt-cell';cell.textContent=mark;cell.disabled=!!mark||!!winner();cell.addEventListener('click',()=>{if(winner()||board[i])return;board[i]=playerTurn;playerTurn=playerTurn==='X'?'O':'X';renderBoard();const win=winner();gameFeedback.textContent=win?`${win} wins!`:board.every(Boolean)?'It is a draw!':`${playerTurn}'s turn`;});tttBoard.appendChild(cell);});
  }
  function winner(){const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];for(const line of lines){const [a,b,c]=line;if(board[a]&&board[a]===board[b]&&board[a]===board[c])return board[a];}return '';}
  document.getElementById('acceptGame')?.addEventListener('click',()=>{
    inviteBox.hidden=true;gameFeedback.textContent='Game started! This is a local preview; the other phone is not connected yet.';
    if(selectedGame==='ttt'){board=Array(9).fill('');playerTurn='X';tttBoard.hidden=false;wordArea.hidden=true;renderBoard();}
    if(selectedGame==='word'){tttBoard.hidden=true;wordArea.hidden=false;wordTurnUser='You';yourScore=0;friendScore=0;usedWords.clear();document.getElementById('wordHistory').innerHTML='';updateWordScore();document.getElementById('wordTurn').textContent='Your turn';}
  });
  function updateWordScore(){document.getElementById('wordScore').textContent=`You: ${yourScore} · Friend: ${friendScore}`;}
  document.getElementById('wordForm')?.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('wordInput');const word=input.value.trim().toLowerCase();if(!/^[a-z]{2,16}$/.test(word)){gameFeedback.textContent='Please enter a word using 2–16 English letters.';return;}if(usedWords.has(word)){gameFeedback.textContent='That word was already used. Try another.';return;}usedWords.add(word);const points=word.length;yourScore+=points;const row=document.createElement('div');row.textContent=`You: ${word} (+${points})`;document.getElementById('wordHistory').prepend(row);input.value='';updateWordScore();document.getElementById('wordTurn').textContent='Friend’s turn (simulated)';gameFeedback.textContent='Word added. In the live version, your friend will receive the next turn.';});
  document.getElementById('hugButton')?.addEventListener('click',()=>{const msg=document.createElement('div');msg.className='chat-bubble sent';msg.textContent='🤗 Sent a Hug · demo';chatMessages.appendChild(msg);chatMessages.scrollTop=chatMessages.scrollHeight;});

})();
