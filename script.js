const views = [...document.querySelectorAll('.view')];
const tabs = document.querySelector('.tabs');
let currentView = 'feed';
let viewHistory = [];

function showView(id, options = {}) {
  if (!document.getElementById(id)) return;
  const previous = currentView;
  if (!options.fromPop && previous !== id && options.remember !== false) {
    viewHistory.push(previous);
  }
  currentView = id;

  views.forEach(v => v.classList.toggle('active', v.id === id));
  document.querySelectorAll('.tab[data-view]').forEach(b =>
    b.classList.toggle('active', b.dataset.view === id)
  );

  // Registration is a focused screen: hide the main section tabs while it is open.
  if (tabs) tabs.hidden = (id === 'account');

  document.body.classList.toggle('registration-open', id === 'account');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-view]').forEach(b =>
  b.addEventListener('click', () => showView(b.dataset.view))
);

document.getElementById('profileShortcut').addEventListener('click', () => showView('profile'));
document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault();
  showView('feed');
});

document.querySelectorAll('.like-btn').forEach(b => b.addEventListener('click', () => {
  const liked = b.classList.toggle('liked');
  b.firstChild.textContent = liked ? '♥ ' : '♡ ';
  b.querySelector('span').textContent = liked ? 'Liked' : 'Like';
}));

const fileInput = document.getElementById('mediaFile');
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0], preview = document.getElementById('preview');
  preview.innerHTML = '';
  if (!file) return;
  const url = URL.createObjectURL(file);
  const el = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
  el.src = url;
  if (el.tagName === 'VIDEO') el.controls = true;
  preview.appendChild(el);
});

document.getElementById('demoPost').addEventListener('click', () => {
  const msg = document.getElementById('uploadMessage');
  msg.hidden = false;
  msg.textContent = fileInput.files.length
    ? 'Local preview ready. This file has not been uploaded or published.'
    : 'Choose a photo or video first to preview it.';
});

document.getElementById('demoRegister').addEventListener('click', () => {
  alert('YUNEX registration screen preview only. Backend authentication and permanent YUNEX ID will be connected in the next phase. Do not enter real credentials.');
});

document.querySelectorAll('.category-grid button').forEach(b => b.addEventListener('click', () => {
  document.getElementById('exploreSearch').value = b.innerText.replace(/[^\\w\\s]/g, '').trim();
}));

// Keep the Home welcome poster exclusive to the Home Feed; each view is independently shown.
showView('feed', { remember: false });
