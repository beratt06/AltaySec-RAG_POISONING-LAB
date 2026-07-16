var state = {
  provider: 'gemini',
  apiKey: null,
  currentLevel: null,
  isLoading: false,
  chatHistories: { easy: [], medium: [], hard: [] },
  completedLevels: JSON.parse(localStorage.getItem('rag_completed') || '[]')
};

var CHALLENGES = {
  easy: {
    id: 'easy', name: 'Kolay', icon: '🔓', subtitle: 'Doğrudan Yükleme',
    description: 'Sistem yüklenen içeriği filtresiz kabul eder. Tüm belgeler doğrudan LLM\'e gönderilir.',
    objective: 'CV aracılığıyla RAG veritabanına zehirli komutlar ekle ve bayrağı al.',
    difficulty: 1, stars: '★★☆☆☆'
  },
  medium: {
    id: 'medium', name: 'Orta', icon: '📞', subtitle: 'IT Destek',
    description: 'WAF aktif: İngilizce injection kelimeleri yasaklı. Payload\'lar 300 karakterlik parçalara bölünür.',
    objective: 'WAF\'dan kaçan Türkçe bir payload yaz ve soru ile anahtar kelimeleri örtüştür.',
    difficulty: 2, stars: '★★★☆☆'
  },
  hard: {
    id: 'hard', name: 'Zor', icon: '🛑', subtitle: 'Kurumsal Arşiv',
    description: 'Sıkı WAF (Türkçe+İngilizce yasaklı kelimeler) ve 50 karakterlik agresif chunking.',
    objective: 'Her satır < 50 karakter, WAF\'sız ve sorguyla örtüşen çoklu chunk oluştur.',
    difficulty: 3, stars: '★★★★★'
  }
};

var API = '/api';

function ge(id) { return document.getElementById(id); }

function escHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function showScreen(name) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
  ge('screen-' + name).classList.add('active');
}

function initSetup() {
  var savedProvider = sessionStorage.getItem('rag_provider');
  var savedKey = sessionStorage.getItem('rag_key');
  if (savedProvider && savedKey) {
    state.provider = savedProvider;
    state.apiKey = savedKey;
    renderChallenges();
    showScreen('challenges');
    return;
  }

  var provBtns = document.querySelectorAll('.provider-btn');
  for (var i = 0; i < provBtns.length; i++) {
    provBtns[i].addEventListener('click', function() {
      for (var j = 0; j < provBtns.length; j++) provBtns[j].classList.remove('active');
      this.classList.add('active');
      state.provider = this.getAttribute('data-provider');
    });
  }

  var toggleBtn = ge('toggle-key-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var input = ge('api-key');
      input.type = input.type === 'password' ? 'text' : 'password';
      ge('eye-icon').textContent = input.type === 'password' ? '👁' : '🙈';
    });
  }

  var form = ge('setup-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var apiKey = ge('api-key').value.trim();
      if (!apiKey) return;
      state.apiKey = apiKey;
      state.provider = document.querySelector('.provider-btn.active').getAttribute('data-provider');
      sessionStorage.setItem('rag_provider', state.provider);
      sessionStorage.setItem('rag_key', apiKey);
      renderChallenges();
      showScreen('challenges');
    });
  }
}

function renderChallenges() {
  var badge = ge('provider-badge');
  if (badge) badge.textContent = state.provider === 'gemini' ? '🔮 Gemini 2.0 Flash' : '⚡ Groq Llama3';

  var grid = ge('challenge-grid');
  if (!grid) return;
  grid.innerHTML = '';

  var levels = ['easy', 'medium', 'hard'];
  levels.forEach(function(id) {
    var ch = CHALLENGES[id];
    var completed = state.completedLevels.indexOf(id) > -1;
    var diffLabel = { easy: 'KOLAY', medium: 'ORTA', hard: 'ZOR' }[id];

    var card = document.createElement('div');
    card.className = 'challenge-card difficulty-' + ch.difficulty + (completed ? ' completed' : '');
    card.innerHTML = (completed ? '<div class="completed-badge">✓ TAMAMLANDI</div>' : '') +
      '<div class="card-icon">' + ch.icon + '</div>' +
      '<span class="card-badge">' + diffLabel + '</span>' +
      '<div class="card-subtitle">' + ch.subtitle + '</div>' +
      '<h3 class="card-title">' + ch.name + '</h3>' +
      '<div class="card-stars">' + ch.stars + '</div>' +
      '<p class="card-desc">' + ch.description + '</p>' +
      '<button class="card-btn" type="button" data-level="' + id + '">' + (completed ? '↺ Tekrar Oyna' : '→ Başla') + '</button>';

    var btn = card.querySelector('.card-btn');
    btn.addEventListener('click', function() { openLab(this.getAttribute('data-level')); });
    grid.appendChild(card);
  });
}

function openLab(level) {
  state.currentLevel = level;
  var ch = CHALLENGES[level];

  ge('lab-level-badge').textContent = ch.name.toUpperCase();
  ge('lab-subtitle-text').textContent = ch.subtitle;
  ge('lab-objective').textContent = ch.objective;

  // Injection UI logic
  ge('inject-textarea').value = '';
  ge('inject-status').style.display = 'none';
  ge('injection-upload-area').style.display = 'block';

  if (level === 'easy') {
    ge('injection-icon').textContent = "📄";
    ge('injection-title').innerHTML = 'Aday Başvuru Portalı <span class="sidebar-badge" id="injection-badge" style="font-size: 0.7em; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 5px;">CV Yükle</span>';
    ge('injection-desc').textContent = "Lütfen özgeçmiş veya başvuru niyet mektubunuzu sisteme girin.";
    ge('inject-textarea').placeholder = "Özgeçmişinizi buraya yapıştırın...";
    ge('inject-btn-text').textContent = "BAŞVURUYU GÖNDER";
  } else if (level === 'medium') {
    ge('injection-icon').textContent = "📞";
    ge('injection-title').innerHTML = 'IT Destek Sistemi <span class="sidebar-badge" id="injection-badge" style="font-size: 0.7em; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 5px;">WAF Aktif</span>';
    ge('injection-desc').textContent = "Sistemsel sorununuzu veya talebinizi belirtin.";
    ge('inject-textarea').placeholder = "Destek talebinizi buraya girin...";
    ge('inject-btn-text').textContent = "TALEBİ GÖNDER";
  } else if (level === 'hard') {
    ge('injection-icon').textContent = "📁";
    ge('injection-title').innerHTML = 'Kurumsal Arşiv Sistemi <span class="sidebar-badge" id="injection-badge" style="font-size: 0.7em; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 5px;">Katı WAF</span>';
    ge('injection-desc').textContent = "Kurum içi yazışma veya dökümanınızı arşive kaydedin.";
    ge('inject-textarea').placeholder = "Rapor metnini buraya girin...";
    ge('inject-btn-text').textContent = "DÖKÜMANI ARŞİVLE";
  }

  showScreen('lab');

  var fi = ge('flag-input');
  var fr = ge('flag-result');
  if (fi) fi.value = '';
  if (fr) { fr.textContent = ''; fr.className = 'flag-result'; }

  renderChat(level);
}

function renderChat(level) {
  var container = ge('chat-messages');
  container.innerHTML = '';
  var history = state.chatHistories[level];

  if (history.length === 0) {
    if (level === 'easy') {
      appendSystemMessage('[' + CHALLENGES[level].subtitle + '] İK Portalı aktif. Başvurunuzu yükleyip asistanla görüşebilirsiniz.');
    } else if (level === 'medium') {
      appendSystemMessage('[' + CHALLENGES[level].subtitle + '] IT Destek Sistemi aktif. Taleplerinizi iletebilirsiniz.');
    } else {
      appendSystemMessage('[' + CHALLENGES[level].subtitle + '] Arşiv Sistemi aktif. Döküman yükleyip analiz edebilirsiniz.');
    }
  } else {
    history.forEach(function(m) { appendMessage(m.role, m.content, false); });
  }
  updateMsgCount(level);
}

function appendMessage(role, content, save) {
  if (save === undefined) save = true;
  var level = state.currentLevel;
  var highlighted = escHtml(content).replace(/AltaySec\{[^}]+\}/g, function(match) {
    return '<span class="flag-highlight" title="Tıkla → kopyala">' + match + '</span>';
  });
  var labels = { user: '[ SEN ]', assistant: '[ ASİSTAN ]', system: '[ SİSTEM ]' };

  var div = document.createElement('div');
  div.className = 'chat-message ' + role;
  div.innerHTML = '<div class="msg-role">' + (labels[role] || '[ ? ]') + '</div><div class="msg-bubble">' + highlighted + '</div>';

  var spans = div.querySelectorAll('.flag-highlight');
  spans.forEach(function(span) {
    span.addEventListener('click', function() {
      ge('flag-input').value = span.textContent;
      showFlagToast();
    });
  });

  ge('chat-messages').appendChild(div);

  if (save && level) {
    state.chatHistories[level].push({ role: role, content: content });
    updateMsgCount(level);
  }

  if (role === 'assistant') {
    var m = content.match(/AltaySec\{[^}]+\}/);
    if (m) {
      ge('flag-input').value = m[0];
      showFlagToast();
    }
  }
  scrollBottom();
}

function appendSystemMessage(text) {
  var div = document.createElement('div');
  div.className = 'chat-message system';
  div.innerHTML = '<div class="msg-role">[ SİSTEM ]</div><div class="msg-bubble">' + escHtml(text) + '</div>';
  ge('chat-messages').appendChild(div);
  scrollBottom();
}

function showTyping() {
  var div = document.createElement('div');
  div.id = 'typing-indicator';
  div.className = 'chat-message assistant typing';
  div.innerHTML = '<div class="msg-role">[ ASİSTAN ]</div><div class="msg-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
  ge('chat-messages').appendChild(div);
  scrollBottom();
}

function removeTyping() { var el = ge('typing-indicator'); if (el) el.remove(); }
function scrollBottom() { var c = ge('chat-messages'); if (c) c.scrollTop = c.scrollHeight; }
function updateMsgCount(level) { ge('chat-msg-count').textContent = state.chatHistories[level].length + ' mesaj'; }

// ─── Injection ───────────────────────────────────────────────
function injectData() {
  var level = state.currentLevel;
  var statusEl = ge('inject-status');
  statusEl.style.display = 'block';
  statusEl.textContent = "Gönderiliyor...";
  statusEl.style.color = "#c9d1d9";

  var endpoint = '/api/' + level + '/upload';
  var payload = {};

  var txtVal = ge('inject-textarea').value.trim();
  if (!txtVal) { statusEl.textContent = "Lütfen metin girin!"; statusEl.style.color = "red"; return; }
  payload.content = txtVal;

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json()).then(data => {
    if (data.error) {
      statusEl.textContent = "HATA: " + data.error;
      statusEl.style.color = "var(--error-color)";
    } else {
      statusEl.textContent = "BAŞARILI: " + data.message;
      statusEl.style.color = "var(--success-color)";
      ge('inject-textarea').value = '';
    }
  }).catch(err => {
    statusEl.textContent = "Sunucu Hatası: " + err.message;
    statusEl.style.color = "var(--error-color)";
  });
}

// ─── Send Chat ───────────────────────────────────────────────
function sendMessage() {
  if (state.isLoading) return;

  var textarea = ge('chat-input');
  var message = textarea.value.trim();
  if (!message) return;

  textarea.value = '';
  state.isLoading = true;
  ge('chat-send-btn').disabled = true;

  appendMessage('user', message);
  showTyping();

  fetch('/api/' + state.currentLevel + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: message,
      provider: state.provider,
      apiKey: state.apiKey
    })
  }).then(r => r.json()).then(data => {
    removeTyping();
    if (data.error) {
      appendSystemMessage('HATA: ' + data.error);
    } else {
      appendMessage('assistant', data.response);
      appendSystemMessage('RAG Engine retrieved context of length: ' + data.context.length + ' chars.');
    }
  }).catch(err => {
    removeTyping();
    appendSystemMessage('Bağlantı Hatası: ' + err.message);
  }).finally(() => {
    state.isLoading = false;
    ge('chat-send-btn').disabled = false;
    textarea.focus();
  });
}

// ─── Flag Validation ─────────────────────────────────────────
var toastTimer;
function showFlagToast() {
  var t = ge('flag-toast');
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { t.classList.remove('visible'); }, 3500);
}

function validateFlag() {
  var fi = ge('flag-input');
  var result = ge('flag-result');
  var flag = fi.value.trim();
  if (!flag) return;

  fetch('/api/verify-flag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: state.currentLevel, flag: flag })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      result.textContent = '✓ BAYRAK DOĞRULANDI!';
      result.className = 'flag-result success';
      if (state.completedLevels.indexOf(state.currentLevel) === -1) {
        state.completedLevels.push(state.currentLevel);
        localStorage.setItem('rag_completed', JSON.stringify(state.completedLevels));
      }
      ge('success-level-name').textContent = CHALLENGES[state.currentLevel].name;
      ge('modal-flag-display').textContent = flag;
      ge('success-modal').classList.add('visible');
    } else {
      result.textContent = '✗ Yanlış bayrak.';
      result.className = 'flag-result error';
    }
  });
}

function bindEvents() {
  ge('chat-input').addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  ge('chat-send-btn').addEventListener('click', sendMessage);
  ge('inject-btn').addEventListener('click', injectData);
  ge('flag-submit-btn').addEventListener('click', validateFlag);
  ge('flag-input').addEventListener('keydown', function(e) { if (e.key === 'Enter') validateFlag(); });
  
  ge('back-btn').addEventListener('click', function() { renderChallenges(); showScreen('challenges'); });
  ge('clear-chat-btn').addEventListener('click', function() { 
    state.chatHistories[state.currentLevel] = []; 
    renderChat(state.currentLevel); 
    fetch('/api/' + state.currentLevel + '/reset', { method: 'POST' })
      .then(r => r.json())
      .then(() => appendSystemMessage('Veritabanı ve sohbet geçmişi başarıyla sıfırlandı.'));
  });
  ge('logout-btn').addEventListener('click', function() { sessionStorage.clear(); state.apiKey = null; showScreen('setup'); });

  ge('modal-back-btn').addEventListener('click', function() { ge('success-modal').classList.remove('visible'); renderChallenges(); showScreen('challenges'); });
  ge('modal-continue-btn').addEventListener('click', function() {
    ge('success-modal').classList.remove('visible');
    if (state.currentLevel === 'easy') openLab('medium');
    else if (state.currentLevel === 'medium') openLab('hard');
    else { renderChallenges(); showScreen('challenges'); }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  bindEvents();
  initSetup();
});
