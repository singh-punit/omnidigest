document.addEventListener('DOMContentLoaded', () => {
  /* ================================================================
   * DOM Elements Cache
   * ================================================================ */
  const $ = id => document.getElementById(id);

  const D = {
    // Canvas & Atmosphere
    particleCanvas:      $('particle-canvas'),
    
    // Header Navigation
    brandHomeLink:       $('brand-home-link'),
    btnThemeToggle:      $('btn-theme-toggle'),
    themeIconSun:        $('theme-icon-sun'),
    themeIconMoon:       $('theme-icon-moon'),
    btnLiveNews:         $('btn-live-news'),
    btnFeeds:            $('btn-feeds'),
    btnArchiveDrawer:    $('btn-archive-drawer'),
    aiModelBadge:        $('ai-model-badge'),
    headerHistoryCount:  $('header-history-count'),

    // Studio Input & Controls
    customPromptInput:   $('custom-prompt-input'),
    btnStudioSettings:   $('btn-studio-settings'),
    studioSettingsRow:   $('studio-settings-row'),
    voiceSelect:         $('voice-select'),
    speedRateSelect:     $('speed-rate-select'),
    btnGenerateMain:     $('btn-generate-main'),
    generateSpinner:     $('generate-spinner'),
    chips:               document.querySelectorAll('.chip[data-focus]'),
    genProgress:         $('generation-progress'),
    progressStepText:    $('progress-step-text'),
    progressPercent:     $('progress-percent'),
    progressBarFill:     $('progress-bar-fill'),

    // Error
    errorCard:           $('error-card'),
    errorTitle:          $('error-title'),
    errorMessage:        $('error-message'),
    btnCloseError:       $('btn-close-error'),

    // Top History Strip Carousel
    topHistoryStrip:     $('top-history-strip'),
    stripCarousel:       $('strip-carousel'),
    stripCountLabel:     $('strip-count-label'),
    btnStripScrollLeft:  $('btn-strip-scroll-left'),
    btnStripScrollRight: $('btn-strip-scroll-right'),
    btnViewAllArchive:   $('btn-view-all-archive'),

    // Player Core
    playerCard:          $('player-card'),
    btnPlayPause:        $('btn-play-pause'),
    iconPlay:            $('icon-play'),
    iconPause:           $('icon-pause'),
    currTime:            $('curr-time'),
    totalTime:           $('total-time'),
    waveformCanvas:      $('waveform-canvas'),
    waveformWrapper:     $('waveform-wrapper'),
    waveformSeekLine:    $('waveform-seek-line'),
    waveformTooltip:     $('waveform-tooltip'),
    btnPrevBrief:        $('btn-prev-brief'),
    btnNextBrief:        $('btn-next-brief'),
    btnSpeedToggle:      $('btn-speed-toggle'),
    volSlider:           $('vol-slider'),
    btnMuteToggle:       $('btn-mute-toggle'),
    volIcon:             $('vol-icon'),
    audioElement:        $('audio-element'),
    briefDate:           $('brief-date'),
    briefDateBadge:      $('brief-date-badge'),
    playerTitle:         $('player-title'),

    // Action Ribbon
    btnActionCopy:       $('btn-action-copy'),
    btnActionDownload:   $('btn-action-download'),
    btnActionPin:        $('btn-action-pin'),
    btnActionQr:         $('btn-action-qr'),
    btnActionReset:      $('btn-action-reset'),

    // Highlights & Tabs
    highlightsContainer: $('highlights-container'),
    tabBtns:             document.querySelectorAll('.tab-btn[data-tab]'),
    markdownContent:     $('markdown-content'),
    transcriptContent:   $('transcript-content'),
    scriptWordCount:     $('script-word-count'),
    sourcesList:         $('sources-list'),
    btnCopyTabContent:   $('btn-copy-tab-content'),

    // Archive Slide-Over Drawer
    archiveDrawer:       $('archive-drawer'),
    btnCloseArchive:     $('btn-close-archive'),
    archiveSearch:       $('archive-search'),
    archiveList:         $('archive-list'),
    archiveStatsSub:     $('archive-stats-sub'),
    archivePrevBtn:      $('archive-prev-btn'),
    archiveNextBtn:      $('archive-next-btn'),
    archivePageInfo:     $('archive-page-info'),

    // Live Wire Modal
    liveNewsModal:       $('live-news-modal'),
    modalLiveClose:      $('modal-live-close'),
    btnRefreshLiveNews:  $('btn-refresh-live-news'),
    liveNewsSearch:      $('live-news-search'),
    liveNewsContainer:   $('live-news-container'),
    liveNewsStat:        $('live-news-stat'),
    btnDigestVisible:    $('btn-digest-visible'),
    liveChips:           document.querySelectorAll('.live-chip[data-cat]'),

    // Feeds Modal
    feedsModal:          $('feeds-modal'),
    modalClose:          $('modal-close'),
    feedsContainer:      $('feeds-container'),
    btnAddFeedRow:       $('btn-add-feed-row'),
    btnResetFeeds:       $('btn-reset-feeds'),
    btnSaveFeeds:        $('btn-save-feeds'),

    // QR Modal
    qrModal:             $('qr-modal'),
    modalQrClose:        $('modal-qr-close'),
    qrImage:             $('qr-image'),
    qrLinkInput:         $('qr-link-input'),
    btnQrCopyLink:       $('btn-qr-copy-link'),

    // Floating Toast
    toast:               $('toast'),

    // Command Palette (Cmd+K)
    btnCmdK:             $('btn-cmd-k'),
    cmdKModal:           $('cmd-k-modal'),
    cmdKInput:           $('cmd-k-input'),
    cmdKResults:         $('cmd-k-results'),
  };

  /* ================================================================
   * State Management
   * ================================================================ */
  const THEMES = ['light', 'dark'];
  const SPEEDS = [0.8, 1.0, 1.25, 1.5, 2.0];

  const State = {
    currentDigest: null,
    history: [],
    archivePage: 1,
    archivePerPage: 10,
    archiveQuery: '',
    isPlaying: false,
    speedIdx: 1,
    audioCtx: null,
    analyser: null,
    audioSrc: null,
    previousVolume: 1,
    feeds: [],
    liveArticles: [],
    liveCat: 'all',
    cmdKIndex: 0,
    cmdKFilteredItems: [],
  };

  function enforceCleanBranding() {
    if (D.aiModelBadge) {
      D.aiModelBadge.innerHTML = '<span class="ai-pulse-dot"></span>✦ Qwen 2.5 (1.5B) · Local';
    }
    document.querySelectorAll('.ai-tag, .tag-model, #ai-model-badge, #brief-model-tag, .chip').forEach(el => {
      if (el.textContent && el.textContent.includes('🤖')) {
        el.textContent = el.textContent.replace(/🤖/g, '✦');
      }
    });
  }

  function init() {
    initTheme();
    enforceCleanBranding();
    initWaveform();
    setupMediaSessionHandlers();
    initEventListeners();
    loadHistory().then(() => {
      loadLatestDigest();
      enforceCleanBranding();
    });
  }

  /* ================================================================
   * Helper Utilities
   * ================================================================ */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function formatDate(isoOrTs) {
    if (!isoOrTs) return 'Recent';
    try {
      const d = new Date(typeof isoOrTs === 'number' ? isoOrTs * 1000 : isoOrTs);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(isoOrTs);
    }
  }

  /* ================================================================
   * UI Feedback / Toasts
   * ================================================================ */
  let toastTimer = null;
  function showToast(msg) {
    const t = D.toast;
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function showError(title, msg) {
    if (D.errorTitle) D.errorTitle.textContent = title || 'Error';
    if (D.errorMessage) D.errorMessage.textContent = msg || 'An error occurred';
    if (D.errorCard) D.errorCard.style.display = 'flex';
  }

  function hideError() {
    if (D.errorCard) D.errorCard.style.display = 'none';
  }

  /* ================================================================
   * Unified API Fetch Utility
   * ================================================================ */
  async function api(endpoint, method = 'GET', body = null) {
    try {
      const opts = { method, headers: {} };
      if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
      const res = await fetch(endpoint, opts);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn('OmniDigest API notification:', err);
      return null;
    }
  }

  /* ================================================================
   * Theme Management (Light Porcelain / Dark Obsidian)
   * ================================================================ */
  function initTheme() {
    const saved = localStorage.getItem('omnidigest_theme') || 'light';
    applyTheme(saved);
  }

  function applyTheme(themeName) {
    if (themeName !== 'dark') themeName = 'light';
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('omnidigest_theme', themeName);
    if (D.themeIconSun && D.themeIconMoon) {
      if (themeName === 'dark') {
        D.themeIconSun.style.display = 'block';
        D.themeIconMoon.style.display = 'none';
      } else {
        D.themeIconSun.style.display = 'none';
        D.themeIconMoon.style.display = 'block';
      }
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    showToast(next === 'light' ? 'Porcelain Light Mode' : 'Obsidian Dark Mode');
  }

  /* ================================================================
   * Modal Management
   * ================================================================ */
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
  }

  function closeAllOverlays() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    if (D.archiveDrawer) D.archiveDrawer.classList.remove('active');
    if (D.cmdKInput) D.cmdKInput.blur();
  }

  /* ================================================================
   * Harmonic Acoustic Soundwave Background Canvas (Podcast Audio Theme)
   * ================================================================ */
  function initAcousticWaves() {
    const canvas = D.particleCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let cw, ch;
    let phase = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    const waveLayers = [
      { amp: 38, freq: 0.0032, speed: 0.012, yRatio: 0.72, opacity: 0.16, strokeW: 2 },
      { amp: 26, freq: 0.0055, speed: 0.018, yRatio: 0.76, opacity: 0.22, strokeW: 1.5 },
      { amp: 48, freq: 0.0020, speed: 0.008, yRatio: 0.80, opacity: 0.10, strokeW: 2.5 },
      { amp: 20, freq: 0.0068, speed: 0.024, yRatio: 0.84, opacity: 0.18, strokeW: 1.2 }
    ];

    function renderWaves() {
      ctx.clearRect(0, 0, cw, ch);
      const style = getComputedStyle(document.documentElement);
      const rgb = style.getPropertyValue('--particle-color').trim() || '56, 189, 248';
      
      const playBoost = State.isPlaying ? 1.55 : 1.0;
      phase += 0.014 * playBoost;

      for (let i = 0; i < waveLayers.length; i++) {
        const w = waveLayers[i];
        const baseY = ch * w.yRatio;
        const curAmp = w.amp * playBoost;

        ctx.beginPath();
        ctx.moveTo(0, baseY);

        for (let x = 0; x <= cw; x += 10) {
          const y = baseY + 
            Math.sin(x * w.freq + phase * (w.speed * 85) + i * 1.5) * curAmp +
            Math.cos(x * w.freq * 0.45 - phase * 0.4) * (curAmp * 0.35);
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(${rgb}, ${w.opacity})`;
        ctx.lineWidth = w.strokeW;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Subtle gradient under lower layer
        if (i === 1) {
          ctx.lineTo(cw, ch);
          ctx.lineTo(0, ch);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, baseY - curAmp, 0, ch);
          grad.addColorStop(0, `rgba(${rgb}, 0.035)`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      requestAnimationFrame(renderWaves);
    }
    renderWaves();
  }

  /* ================================================================
   * Interactive Waveform Scrubber with Web Audio Integration
   * ================================================================ */
  let waveformBars = [];
  let waveformCtx = null;

  function initWaveform() {
    if (!D.waveformCanvas || !D.waveformWrapper) return;
    waveformCtx = D.waveformCanvas.getContext('2d');

    function resizeWaveform() {
      const rect = D.waveformWrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      D.waveformCanvas.width = w * dpr;
      D.waveformCanvas.height = h * dpr;
      D.waveformCanvas.style.width = w + 'px';
      D.waveformCanvas.style.height = h + 'px';
      waveformCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resizeWaveform);
    resizeWaveform();

    generateWaveformBars('init');
    requestAnimationFrame(drawWaveformLoop);

    // Mouse scrubber seek interactions
    D.waveformWrapper.addEventListener('mousemove', e => {
      if (!D.audioElement || !D.audioElement.duration) return;
      const rect = D.waveformWrapper.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = rect.width > 0 ? x / rect.width : 0;
      D.waveformSeekLine.style.display = 'block';
      D.waveformSeekLine.style.left = `${x}px`;
      D.waveformTooltip.style.display = 'block';
      D.waveformTooltip.style.left = `${x}px`;
      D.waveformTooltip.textContent = formatTime(ratio * D.audioElement.duration);
    });

    D.waveformWrapper.addEventListener('mouseleave', () => {
      D.waveformSeekLine.style.display = 'none';
      D.waveformTooltip.style.display = 'none';
    });

    D.waveformWrapper.addEventListener('click', e => {
      if (!D.audioElement || !D.audioElement.duration) return;
      const rect = D.waveformWrapper.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      D.audioElement.currentTime = ratio * D.audioElement.duration;
      if (D.audioElement.paused) togglePlay(true);
    });
  }

  function generateWaveformBars(seedStr) {
    let seed = 42;
    for (let i = 0; i < (seedStr || 'x').length; i++) {
      seed += (seedStr || 'x').charCodeAt(i) * (i + 1);
    }
    waveformBars = [];
    for (let i = 0; i < 70; i++) {
      const x = Math.sin(seed + i * 0.28) * 0.5 + 0.5;
      const y = Math.cos(seed * 0.7 + i * 0.15) * 0.3 + 0.5;
      waveformBars.push(Math.max(0.18, Math.min(0.96, (x + y) / 2)));
    }
  }

  function drawWaveformLoop() {
    drawWaveform();
    requestAnimationFrame(drawWaveformLoop);
  }

  function drawWaveform() {
    if (!waveformCtx || !D.waveformWrapper) return;
    const rect = D.waveformWrapper.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return;
    waveformCtx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#0284c7';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const unplayed = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.12)';

    const progress = (D.audioElement && D.audioElement.duration)
      ? D.audioElement.currentTime / D.audioElement.duration : 0;

    // Dynamic bar count based on container width - strictly clamped so it NEVER overflows mobile bounds
    const minSlot = 5;
    const totalBars = Math.max(18, Math.min(60, Math.floor(w / minSlot)));
    const barW = Math.max(2, (w / totalBars) * 0.6);
    const gap = totalBars > 1 ? (w - (totalBars * barW)) / (totalBars - 1) : 0;

    // Read real-time frequency data if active
    let freqData = null;
    if (State.isPlaying && State.analyser) {
      freqData = new Uint8Array(State.analyser.frequencyBinCount);
      State.analyser.getByteFrequencyData(freqData);
    }

    for (let i = 0; i < totalBars; i++) {
      const ratio = i / totalBars;
      const x = i * (barW + gap);
      if (x + barW > w + 0.5) continue;

      const barDataIdx = Math.floor((i / totalBars) * waveformBars.length);
      let baseH = waveformBars[barDataIdx] || 0.5;
      if (freqData) {
        const binIdx = Math.floor((i / totalBars) * freqData.length * 0.7);
        const freqAmp = (freqData[binIdx] || 25) / 255;
        baseH = baseH * 0.4 + freqAmp * 0.85;
        baseH = Math.max(0.15, Math.min(1.0, baseH));
      }

      const barH = Math.max(4, baseH * (h - 8));
      const y = (h - barH) / 2;

      waveformCtx.fillStyle = ratio <= progress ? accent : unplayed;
      waveformCtx.beginPath();
      if (waveformCtx.roundRect) {
        waveformCtx.roundRect(x, y, barW, barH, barW / 2);
      } else {
        waveformCtx.rect(x, y, barW, barH);
      }
      waveformCtx.fill();
    }
  }

  /* ================================================================
   * Web Audio Visualizer Pipeline
   * ================================================================ */
  function initWebAudio() {
    if (State.audioCtx) {
      if (State.audioCtx.state === 'suspended') State.audioCtx.resume();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      State.audioCtx = new AudioCtx();
      State.analyser = State.audioCtx.createAnalyser();
      State.analyser.fftSize = 128;
      State.analyser.smoothingTimeConstant = 0.8;
      State.audioSrc = State.audioCtx.createMediaElementSource(D.audioElement);
      State.audioSrc.connect(State.analyser);
      State.analyser.connect(State.audioCtx.destination);
    } catch (err) {
      console.warn('Web Audio initialization skipped:', err);
    }
  }

  /* ================================================================
   * Audio Playback Controls
   * ================================================================ */
  function togglePlay(forcePlay = false) {
    if (!D.audioElement || !D.audioElement.src || D.audioElement.src === location.href) {
      showToast('No briefing loaded yet. Synthesize above.');
      return;
    }
    initWebAudio();
    if (forcePlay || D.audioElement.paused) {
      D.audioElement.play().then(() => {
        State.isPlaying = true;
        updatePlayPauseUI();
        renderRecentStrip();
      }).catch(err => {
        showToast('🔊 Audio playback blocked: ' + err.message);
      });
    } else {
      D.audioElement.pause();
      State.isPlaying = false;
      updatePlayPauseUI();
      renderRecentStrip();
    }
  }

  function updatePlayPauseUI() {
    if (D.iconPlay) D.iconPlay.style.display = State.isPlaying ? 'none' : 'block';
    if (D.iconPause) D.iconPause.style.display = State.isPlaying ? 'block' : 'none';
    if (D.playerCard) D.playerCard.classList.toggle('playing', State.isPlaying);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = State.isPlaying ? 'playing' : 'paused';
    }
  }

  function playPrevBriefing() {
    if (!State.currentDigest || State.history.length === 0) return;
    const idx = State.history.findIndex(h => h.id === State.currentDigest.id);
    if (idx < State.history.length - 1) {
      renderDigest(State.history[idx + 1]);
      togglePlay(true);
    }
  }

  function playNextBriefing() {
    if (!State.currentDigest || State.history.length === 0) return;
    const idx = State.history.findIndex(h => h.id === State.currentDigest.id);
    if (idx > 0) {
      renderDigest(State.history[idx - 1]);
      togglePlay(true);
    }
  }

  /* ================================================================
   * MediaSession API (Lock Screen & Hardware Key Controls)
   * ================================================================ */
  function setupMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => togglePlay(true));
      navigator.mediaSession.setActionHandler('pause', () => togglePlay(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevBriefing());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextBriefing());
      navigator.mediaSession.setActionHandler('seekbackward', details => {
        if (D.audioElement) D.audioElement.currentTime = Math.max(D.audioElement.currentTime - (details.seekOffset || 10), 0);
      });
      navigator.mediaSession.setActionHandler('seekforward', details => {
        if (D.audioElement) D.audioElement.currentTime = Math.min(D.audioElement.currentTime + (details.seekOffset || 10), D.audioElement.duration || 0);
      });
    } catch (err) {
      console.warn('MediaSession setup failed:', err);
    }
  }

  function updateMediaSession(digest, dateStr) {
    if (!('mediaSession' in navigator) || !digest) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: digest.custom_prompt || 'OmniDigest Daily Intelligence Briefing',
        artist: 'OmniDigest · Qwen 2.5 (1.5B) Local',
        album: dateStr || digest.date || 'Homelab Audio',
        artwork: [
          { src: '/static/omnidigest.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/static/omnidigest.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      });
      navigator.mediaSession.playbackState = State.isPlaying ? 'playing' : 'paused';
    } catch (err) {
      console.warn('MediaSession metadata update failed:', err);
    }
  }

  /* ================================================================
   * Volume Management
   * ================================================================ */
  function updateVolumeIcon() {
    if (!D.volIcon) return;
    const vol = D.audioElement ? D.audioElement.volume : 1;
    const muted = D.audioElement ? D.audioElement.muted : false;
    if (muted || vol === 0) {
      D.volIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`;
    } else if (vol < 0.5) {
      D.volIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
    } else {
      D.volIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
    }
  }

  /* ================================================================
   * Data Loading
   * ================================================================ */
  async function loadLatestDigest() {
    const data = await api('/api/digest/latest');
    if (data && data.id) renderDigest(data);
  }

  async function loadHistory() {
    const data = await api('/api/digest/history');
    if (data && Array.isArray(data)) {
      State.history = data;
      if (D.headerHistoryCount) D.headerHistoryCount.textContent = data.length;
      if (D.stripCountLabel) D.stripCountLabel.textContent = `${data.length} editions`;
      renderRecentStrip();
    }
  }

  /* ================================================================
   * Render Briefing Presentation
   * ================================================================ */
  function renderDigest(digest) {
    if (!digest) return;
    State.currentDigest = digest;

    // Header & Meta Info
    const dateStr = digest.date || new Date(digest.created_at).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
    if (D.briefDate) D.briefDate.textContent = dateStr;
    const isLatest = State.history.length > 0 && digest.id === State.history[0].id;
    if (D.briefDateBadge) D.briefDateBadge.textContent = isLatest ? 'Current Edition' : 'Archived Edition';
    if (D.playerTitle) D.playerTitle.textContent = digest.custom_prompt || 'OmniDigest Executive Briefing';

    // Audio Setup (Use relative URL so it plays seamlessly across LAN, Tailscale, Cloudflare)
    const audioSrc = digest.audio_file ? ('/podcasts/' + digest.audio_file) : (digest.audio_url ? (digest.audio_url.startsWith('http') ? new URL(digest.audio_url).pathname : digest.audio_url) : '');
    if (D.audioElement && audioSrc) {
      D.audioElement.src = audioSrc;
      D.audioElement.load();
      D.audioElement.playbackRate = SPEEDS[State.speedIdx];
      updateMediaSession(digest, dateStr);
    }
    if (D.btnActionDownload) {
      if (audioSrc) {
        D.btnActionDownload.href = audioSrc;
        D.btnActionDownload.style.display = 'inline-flex';
      } else {
        D.btnActionDownload.style.display = 'none';
      }
    }

    // Waveform regeneration
    generateWaveformBars(digest.id || 'x');

    // Strategic Highlights
    if (D.highlightsContainer) {
      if (digest.highlights && digest.highlights.length > 0) {
        D.highlightsContainer.innerHTML = digest.highlights
          .map(h => `<div class="hl-card">${escapeHtml(h)}</div>`).join('');
      } else {
        D.highlightsContainer.innerHTML = '';
      }
    }

    // Markdown Strategic Memo Tab
    if (D.markdownContent) {
      if (typeof marked !== 'undefined' && digest.markdown_report) {
        D.markdownContent.innerHTML = marked.parse(digest.markdown_report);
      } else if (digest.markdown_report) {
        D.markdownContent.innerText = digest.markdown_report;
      } else {
        D.markdownContent.innerHTML = `<div class="welcome-empty"><h3>Welcome to OmniDigest</h3><p>Click play or hit <kbd>Enter</kbd> to synthesize your first briefing.</p></div>`;
      }
    }

    // Teleprompter Radio Broadcast Tab
    if (D.transcriptContent) {
      if (digest.audio_script) {
        D.transcriptContent.innerHTML = `<p>${escapeHtml(digest.audio_script).replace(/\n\n/g, '</p><p>')}</p>`;
        const words = digest.audio_script.trim().split(/\s+/).length;
        if (D.scriptWordCount) D.scriptWordCount.textContent = `${words} words (~${Math.ceil(words / 140)} min)`;
      } else {
        D.transcriptContent.innerHTML = `<p class="placeholder">Spoken script will appear after synthesis.</p>`;
        if (D.scriptWordCount) D.scriptWordCount.textContent = '0 words';
      }
    }

    // Source Feed Wire Tab
    if (D.sourcesList) {
      if (digest.sources && digest.sources.length > 0) {
        D.sourcesList.innerHTML = digest.sources.map(s => {
          const host = s.link ? new URL(s.link).hostname.replace('www.', '') : s.source;
          return `<a href="${escapeHtml(s.link || '#')}" target="_blank" rel="noopener noreferrer" class="src-card">
            <div class="src-top"><span class="src-badge">${escapeHtml(s.source || host)}</span><span class="src-cat">${escapeHtml(s.category || 'intel')}</span></div>
            <span class="src-title">${escapeHtml(s.title || 'Source Story')}</span>
          </a>`;
        }).join('');
      } else {
        D.sourcesList.innerHTML = `<p class="placeholder">No explicit source articles attached to this edition.</p>`;
      }
    }

    // Pin UI State
    updatePinUI(digest.pinned);

    // Refresh Carousel & Archive active highlights
    renderRecentStrip();
    if (D.archiveDrawer && D.archiveDrawer.classList.contains('active')) renderArchiveList();
  }

  function updatePinUI(pinned) {
    if (!D.btnActionPin) return;
    if (pinned) {
      D.btnActionPin.classList.add('pinned');
      D.btnActionPin.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span class="act-label">Pinned</span>`;
    } else {
      D.btnActionPin.classList.remove('pinned');
      D.btnActionPin.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span class="act-label">Pin</span>`;
    }
  }

  /* ================================================================
   * Recent Briefings Carousel with Chevrons
   * ================================================================ */
  function renderRecentStrip() {
    if (!D.stripCarousel) return;
    const items = State.history.slice(0, 10);
    if (items.length === 0) {
      D.stripCarousel.innerHTML = `<div style="padding: 0.5rem; color: var(--text-muted); font-size: 0.78rem;">No briefings generated yet.</div>`;
      updateCarouselNavButtons();
      return;
    }

    D.stripCarousel.innerHTML = items.map((item, idx) => {
      const isActive = State.currentDigest && State.currentDigest.id === item.id;
      const isPlaying = isActive && State.isPlaying;
      const title = item.custom_prompt || item.date || `Briefing #${item.id}`;
      const dateFormatted = item.date ? item.date.split('-')[0].trim() : 'Edition';

      return `
        <div class="history-strip-card ${isActive ? 'active-playing-card active' : ''}" data-id="${item.id}" data-idx="${idx}">
          <div class="strip-card-thumb">
            <img src="/static/omnidigest.svg" alt="Cover">
            <span class="strip-badge-top-left">${item.pinned ? '★' : '#' + (idx + 1)}</span>
            <span class="strip-badge-top-right">${item.articles_count || 0} src</span>
            <div class="strip-card-equalizer-overlay ${isPlaying ? 'always-active on' : ''}">
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
            </div>
          </div>
          <div class="strip-card-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
          <div class="strip-card-meta">${escapeHtml(dateFormatted)}</div>
        </div>
      `;
    }).join('');

    D.stripCarousel.querySelectorAll('.history-strip-card').forEach(card => {
      card.addEventListener('click', () => {
        const found = State.history.find(h => String(h.id) === card.dataset.id);
        if (found) {
          renderDigest(found);
          togglePlay(true);
        }
      });
    });

    setTimeout(updateCarouselNavButtons, 50);
  }

  function updateCarouselNavButtons() {
    if (!D.stripCarousel || !D.btnStripScrollLeft || !D.btnStripScrollRight) return;
    const canScrollLeft = D.stripCarousel.scrollLeft > 10;
    const canScrollRight = D.stripCarousel.scrollLeft < (D.stripCarousel.scrollWidth - D.stripCarousel.clientWidth - 10);

    D.btnStripScrollLeft.classList.toggle('disabled', !canScrollLeft);
    D.btnStripScrollRight.classList.toggle('disabled', !canScrollRight);
  }

  /* ================================================================
   * Archive Slide-Over Drawer
   * ================================================================ */
  function renderArchiveList() {
    if (!D.archiveList) return;

    let filtered = State.history;
    if (State.archiveQuery) {
      const q = State.archiveQuery.toLowerCase();
      filtered = filtered.filter(h =>
        (h.custom_prompt || '').toLowerCase().includes(q) ||
        (h.date || '').toLowerCase().includes(q)
      );
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / State.archivePerPage));
    if (State.archivePage > totalPages) State.archivePage = totalPages;
    if (State.archivePage < 1) State.archivePage = 1;

    if (D.archiveStatsSub) D.archiveStatsSub.textContent = `${filtered.length} briefings`;
    if (D.archivePageInfo) D.archivePageInfo.textContent = `${State.archivePage} / ${totalPages}`;

    const start = (State.archivePage - 1) * State.archivePerPage;
    const page = filtered.slice(start, start + State.archivePerPage);

    D.archiveList.innerHTML = page.map(item => {
      const isActive = State.currentDigest && State.currentDigest.id === item.id;
      const dateStr = item.date || new Date(item.created_at).toLocaleDateString();
      return `
        <div class="arch-card ${isActive ? 'is-active' : ''}" data-id="${item.id}">
          <div class="arch-actions">
            <button class="arch-act arch-pin" data-id="${item.id}" title="Pin/Star">${item.pinned ? '★' : '☆'}</button>
            <button class="arch-act arch-del" data-id="${item.id}" title="Delete Briefing"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
          <div class="arch-date">${escapeHtml(dateStr)} ${item.pinned ? '★' : ''}</div>
          <div class="arch-prompt">${escapeHtml(item.custom_prompt || 'Daily Autonomous Digest')}</div>
          <div class="arch-meta"><span>${item.articles_count || 0} articles</span> · <span>${item.model_used || 'Qwen 2.5'}</span></div>
        </div>
      `;
    }).join('') || '<p class="placeholder">No archived briefings found.</p>';

    // Card Selection
    D.archiveList.querySelectorAll('.arch-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.arch-act')) return;
        const found = State.history.find(h => String(h.id) === card.dataset.id);
        if (found) {
          renderDigest(found);
          closeAllOverlays();
          togglePlay(true);
        }
      });
    });

    // Pin Toggle
    D.archiveList.querySelectorAll('.arch-pin').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const res = await api(`/api/digest/${btn.dataset.id}/pin`, 'POST');
        if (res) {
          const item = State.history.find(h => String(h.id) === btn.dataset.id);
          if (item) item.pinned = res.pinned;
          if (State.currentDigest && String(State.currentDigest.id) === btn.dataset.id) {
            State.currentDigest.pinned = res.pinned;
            updatePinUI(res.pinned);
          }
          renderArchiveList();
          renderRecentStrip();
          showToast(res.pinned ? 'Briefing pinned' : 'Briefing unpinned');
        }
      });
    });

    // Delete with Confirmation
    D.archiveList.querySelectorAll('.arch-del').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Permanently delete this intelligence briefing?')) return;
        await api(`/api/digest/${btn.dataset.id}`, 'DELETE');
        State.history = State.history.filter(h => String(h.id) !== btn.dataset.id);
        if (State.currentDigest && String(State.currentDigest.id) === btn.dataset.id) {
          State.currentDigest = null;
          if (D.audioElement) D.audioElement.src = '';
        }
        renderArchiveList();
        renderRecentStrip();
        showToast('Briefing deleted');
      });
    });

    if (D.archivePrevBtn) D.archivePrevBtn.disabled = State.archivePage <= 1;
    if (D.archiveNextBtn) D.archiveNextBtn.disabled = State.archivePage >= totalPages;
  }

  /* ================================================================
   * Live RSS Feed Wire
   * ================================================================ */
  async function loadLiveNews() {
    if (!D.liveNewsContainer) return;
    D.liveNewsContainer.innerHTML = '<div class="load-state"><div class="spinner"></div><p>Crawling live feeds...</p></div>';
    const data = await api('/api/news/live?max_items=12');
    if (data && data.articles) {
      State.liveArticles = data.articles;
      renderLiveNews();
    } else {
      D.liveNewsContainer.innerHTML = '<p class="placeholder">No live wire articles currently available.</p>';
    }
  }

  function renderLiveNews() {
    if (!D.liveNewsContainer) return;
    let articles = State.liveArticles;
    if (State.liveCat !== 'all') {
      articles = articles.filter(a => (a.category || '').toLowerCase().includes(State.liveCat));
    }
    const query = D.liveNewsSearch ? D.liveNewsSearch.value.toLowerCase() : '';
    if (query) {
      articles = articles.filter(a =>
        (a.title || '').toLowerCase().includes(query) ||
        (a.source || '').toLowerCase().includes(query)
      );
    }

    if (D.liveNewsStat) D.liveNewsStat.textContent = `${articles.length} active stories`;

    D.liveNewsContainer.innerHTML = articles.map(a => `
      <div class="live-card">
        <div class="live-meta"><span class="live-src">${escapeHtml(a.source || 'Source')}</span><span class="live-time">${escapeHtml(a.category || 'tech')}</span></div>
        <a href="${escapeHtml(a.link || '#')}" target="_blank" rel="noopener noreferrer" class="live-title">${escapeHtml(a.title || 'Live Article')}</a>
        ${a.summary ? `<div class="live-summary">${escapeHtml(a.summary)}</div>` : ''}
      </div>
    `).join('') || '<p class="placeholder">No matching articles on this wire channel.</p>';
  }

  /* ================================================================
   * Feed Management
   * ================================================================ */
  async function loadFeeds() {
    const data = await api('/api/feeds');
    if (data && Array.isArray(data)) {
      State.feeds = data;
      renderFeeds();
    }
  }

  function renderFeeds() {
    if (!D.feedsContainer) return;
    D.feedsContainer.innerHTML = State.feeds.map((f, i) => `
      <div class="feed-row" data-idx="${i}">
        <input type="text" value="${escapeHtml(f.name || '')}" placeholder="Source Name" class="feed-input feed-name">
        <input type="url" value="${escapeHtml(f.url || '')}" placeholder="RSS URL" class="feed-input feed-url">
        <input type="text" value="${escapeHtml(f.category || '')}" placeholder="Category" class="feed-cat feed-input">
        <button class="feed-test-btn" title="Test RSS Feed">🧪 Test</button>
        <button class="feed-del" title="Remove Feed">&times;</button>
      </div>
    `).join('');

    D.feedsContainer.querySelectorAll('.feed-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.closest('.feed-row').dataset.idx);
        State.feeds.splice(idx, 1);
        renderFeeds();
      });
    });

    D.feedsContainer.querySelectorAll('.feed-test-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('.feed-row');
        const url = row.querySelector('.feed-url').value;
        if (!url) return showToast('Enter an RSS URL first');
        showToast('🧪 Testing RSS feed connection...');
        const res = await api('/api/feeds/test', 'POST', { url });
        if (res && res.status === 'ok') {
          showToast(`✅ ${res.title || 'Feed OK'} (${res.entries_count || 0} entries)`);
        } else {
          showToast('❌ RSS Feed validation failed');
        }
      });
    });
  }

  /* ================================================================
   * Synthesis Pipeline Execution
   * ================================================================ */
  async function synthesize() {
    const prompt = D.customPromptInput ? D.customPromptInput.value.trim() : '';
    const voice = D.voiceSelect ? D.voiceSelect.value : 'en-US-ChristopherNeural';
    const speedRate = D.speedRateSelect ? D.speedRateSelect.value : '+0%';

    let focusText = '';
    D.chips.forEach(c => { if (c.classList.contains('active')) focusText = c.dataset.focus || ''; });

    const customPrompt = [focusText, prompt].filter(Boolean).join('. ');

    if (D.btnGenerateMain) D.btnGenerateMain.disabled = true;
    if (D.generateSpinner) D.generateSpinner.style.display = 'block';
    if (D.genProgress) D.genProgress.style.display = 'block';

    const steps = [
      { text: '📡 Crawling homelab RSS sources...', pct: 18 },
      { text: '✦ Synthesizing with Qwen 2.5 (1.5B)...', pct: 48 },
      { text: 'Structuring executive intelligence memo...', pct: 70 },
      { text: 'Generating Edge Neural TTS audio broadcast...', pct: 88 },
      { text: '📦 Finalizing audio briefing...', pct: 96 },
    ];
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        if (D.progressStepText) D.progressStepText.textContent = steps[stepIdx].text;
        if (D.progressPercent) D.progressPercent.textContent = steps[stepIdx].pct + '%';
        if (D.progressBarFill) D.progressBarFill.style.width = steps[stepIdx].pct + '%';
        stepIdx++;
      }
    }, 2800);

    if (D.progressStepText) D.progressStepText.textContent = steps[0].text;
    if (D.progressPercent) D.progressPercent.textContent = '18%';
    if (D.progressBarFill) D.progressBarFill.style.width = '18%';

    const res = await api('/api/digest/generate', 'POST', {
      custom_prompt: customPrompt || undefined,
      voice,
      speed_rate: speedRate,
      send_ntfy: true,
    });

    clearInterval(progressInterval);

    if (D.btnGenerateMain) D.btnGenerateMain.disabled = false;
    if (D.generateSpinner) D.generateSpinner.style.display = 'none';
    if (D.genProgress) D.genProgress.style.display = 'none';
    if (D.progressBarFill) D.progressBarFill.style.width = '0%';

    if (res && res.id) {
      showToast('✅ Intelligence briefing synthesized!');
      await loadHistory();
      renderDigest(res);
      togglePlay(true);
    } else {
      showError('Synthesis Pipeline Error', 'Synthesis returned no result. Check local SLM backend status.');
    }
  }

  /* ================================================================
   * Command Palette (Cmd+K / Ctrl+K) Spotlight System
   * ================================================================ */
  const SYSTEM_COMMANDS = [
    {
      id: 'cmd-generate',
      title: 'Synthesize Executive Briefing',
      desc: 'Crawl all feeds, synthesize with local Qwen 2.5 SLM & render audio',
      icon: '✦',
      shortcut: '↵',
      action: () => {
        closeCmdK();
        synthesize();
      }
    },
    {
      id: 'cmd-theme',
      title: 'Toggle Theme (Light / Dark)',
      desc: 'Switch between Porcelain Light and Obsidian Dark editorial palettes',
      icon: '🌓',
      shortcut: 'T',
      action: () => {
        closeCmdK();
        toggleTheme();
      }
    },
    {
      id: 'cmd-play',
      title: 'Play / Pause Briefing Audio',
      desc: 'Toggle speech playback of currently selected edition',
      icon: '▶',
      shortcut: 'Space',
      action: () => {
        closeCmdK();
        togglePlay();
      }
    },
    {
      id: 'cmd-next',
      title: 'Next Briefing Edition',
      desc: 'Skip forward to the next historical briefing',
      icon: '⏭',
      shortcut: 'N',
      action: () => {
        closeCmdK();
        playNextBriefing();
      }
    },
    {
      id: 'cmd-prev',
      title: 'Previous Briefing Edition',
      desc: 'Skip backward to the previous briefing',
      icon: '⏮',
      shortcut: 'P',
      action: () => {
        closeCmdK();
        playPrevBriefing();
      }
    },
    {
      id: 'cmd-live',
      title: 'Open Live RSS News Wire',
      desc: 'Browse raw uncached articles across all active intelligence feeds',
      icon: '📡',
      shortcut: 'L',
      action: () => {
        closeCmdK();
        if (D.btnLiveNews) D.btnLiveNews.click();
      }
    },
    {
      id: 'cmd-archive',
      title: 'Browse Briefing Archive Drawer',
      desc: 'Search, manage, and playback historical briefings',
      icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      shortcut: 'A',
      action: () => {
        closeCmdK();
        if (D.btnArchiveDrawer) D.btnArchiveDrawer.click();
      }
    },
    {
      id: 'cmd-feeds',
      title: 'Configure RSS Feed Sources',
      desc: 'Inspect or update homelab crawler subscriptions',
      icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      shortcut: 'F',
      action: () => {
        closeCmdK();
        if (D.btnFeeds) D.btnFeeds.click();
      }
    },
    {
      id: 'cmd-focus-all',
      title: 'Focus: All Intelligence',
      desc: 'Synthesize across all homelab feeds without category restriction',
      icon: '★',
      shortcut: '',
      action: () => {
        closeCmdK();
        triggerPresetFocus('');
      }
    },
    {
      id: 'cmd-focus-ai',
      title: 'Focus: AI & Machine Learning',
      desc: 'Prioritize frontier LLM models, local inference, and AI research',
      icon: '✦',
      shortcut: '',
      action: () => {
        closeCmdK();
        triggerPresetFocus('AI & LLMs');
      }
    },
    {
      id: 'cmd-focus-dev',
      title: 'Focus: Dev, Linux & Homelab Infra',
      desc: 'Filter articles covering self-hosting, Docker, kernel, and DevOps',
      icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      shortcut: '',
      action: () => {
        closeCmdK();
        triggerPresetFocus('Dev & Infra');
      }
    },
    {
      id: 'cmd-focus-markets',
      title: 'Focus: Markets & Macro Tech',
      desc: 'Focus briefing on venture capital, semiconductors, and economics',
      icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      shortcut: '',
      action: () => {
        closeCmdK();
        triggerPresetFocus('Markets');
      }
    },
    {
      id: 'cmd-focus-security',
      title: 'Focus: Security & Vulnerabilities',
      desc: 'Prioritize CVEs, zero-days, breaches, and defensive advisories',
      icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      shortcut: '',
      action: () => {
        closeCmdK();
        triggerPresetFocus('Security');
      }
    },
    {
      id: 'cmd-copy',
      title: 'Copy Strategic Executive Memo',
      desc: 'Copy current briefing markdown report to clipboard',
      icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
      shortcut: '',
      action: () => {
        closeCmdK();
        if (D.btnActionCopy) D.btnActionCopy.click();
      }
    }
  ];

  function triggerPresetFocus(focusValue) {
    if (!D.chips) return;
    D.chips.forEach(chip => {
      if (chip.dataset.focus === focusValue) {
        chip.click();
      }
    });
  }

  function openCmdK() {
    closeAllOverlays();
    if (!D.cmdKModal) return;
    D.cmdKModal.classList.add('active');
    State.cmdKIndex = 0;
    if (D.cmdKInput) {
      D.cmdKInput.value = '';
      setTimeout(() => D.cmdKInput.focus(), 50);
    }
    renderCmdK('');
  }

  function closeCmdK() {
    if (D.cmdKModal) D.cmdKModal.classList.remove('active');
    if (D.cmdKInput) D.cmdKInput.blur();
  }

  function renderCmdK(query = '') {
    if (!D.cmdKResults) return;
    const q = (query || '').trim().toLowerCase();

    // Filter commands
    const matchingCmds = SYSTEM_COMMANDS.filter(cmd =>
      !q || cmd.title.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q)
    );

    // Filter historical editions
    const matchingEditions = (State.history || []).filter(h => {
      if (!q) return false;
      const title = h.custom_prompt || 'Executive Briefing';
      const date = h.date || '';
      return title.toLowerCase().includes(q) || date.toLowerCase().includes(q);
    }).slice(0, 5).map(h => ({
      id: `edition-${h.id}`,
      title: h.custom_prompt || 'Executive Briefing',
      desc: `${h.date || 'Past Edition'} · ${h.articles_count || 0} stories`,
      icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
      shortcut: 'jump',
      action: () => {
        closeCmdK();
        renderDigest(h);
        togglePlay(true);
      }
    }));

    const allItems = [...matchingCmds, ...matchingEditions];
    State.cmdKFilteredItems = allItems;

    if (allItems.length === 0) {
      D.cmdKResults.innerHTML = `
        <div class="cmd-k-empty">
          <p>No actions or briefings match "<strong>${escapeHtml(q)}</strong>"</p>
        </div>
      `;
      return;
    }

    // Clamp index
    if (State.cmdKIndex >= allItems.length) State.cmdKIndex = 0;

    let html = '';
    if (matchingCmds.length > 0) {
      html += '<div class="cmd-k-group-title">Commands & Actions</div>';
      matchingCmds.forEach((item, idx) => {
        const isAct = idx === State.cmdKIndex;
        html += renderCmdKItemHtml(item, idx, isAct);
      });
    }

    if (matchingEditions.length > 0) {
      html += '<div class="cmd-k-group-title">Historical Briefings</div>';
      matchingEditions.forEach((item, idx) => {
        const globalIdx = matchingCmds.length + idx;
        const isAct = globalIdx === State.cmdKIndex;
        html += renderCmdKItemHtml(item, globalIdx, isAct);
      });
    }

    D.cmdKResults.innerHTML = html;

    const activeEl = D.cmdKResults.querySelector('.cmd-k-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }

  function renderCmdKItemHtml(item, idx, isActive) {
    return `
      <div class="cmd-k-item ${isActive ? 'active' : ''}" data-cmd-idx="${idx}">
        <div class="cmd-k-item-left">
          <span class="cmd-k-item-icon">${item.icon}</span>
          <div class="cmd-k-item-info">
            <span class="cmd-k-item-title">${escapeHtml(item.title)}</span>
            <span class="cmd-k-item-desc">${escapeHtml(item.desc)}</span>
          </div>
        </div>
        <div class="cmd-k-item-right">
          ${item.shortcut ? `<span class="cmd-k-shortcut">${escapeHtml(item.shortcut)}</span>` : ''}
        </div>
      </div>
    `;
  }

  function executeCmdKItem(idx) {
    if (State.cmdKFilteredItems && State.cmdKFilteredItems[idx]) {
      State.cmdKFilteredItems[idx].action();
    }
  }

  /* ================================================================
   * Event Listeners & Shortcuts
   * ================================================================ */
  function initEventListeners() {
    // Brand Home Link (Mandatory Universal UX Contract)
    if (D.brandHomeLink) {
      D.brandHomeLink.addEventListener('click', e => {
        e.preventDefault();
        if (D.customPromptInput) D.customPromptInput.value = '';
        D.chips.forEach(c => c.classList.toggle('active', c.dataset.focus === ''));
        if (D.archiveSearch) D.archiveSearch.value = '';
        State.archivePage = 1;
        closeAllOverlays();
        loadLatestDigest();
        loadHistory();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('🏠 Returned to latest intelligence briefing');
      });
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', e => {
      // Cmd+K or Ctrl+K Command Palette Spotlight
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (D.cmdKModal && D.cmdKModal.classList.contains('active')) {
          closeCmdK();
        } else {
          openCmdK();
        }
        return;
      }

      if (e.key === 'Escape') {
        closeAllOverlays();
        return;
      }

      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (e.key === 'Enter' && e.target === D.customPromptInput) synthesize();
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case '/': e.preventDefault(); D.customPromptInput?.focus(); break;
        case 'l': D.btnLiveNews?.click(); break;
        case 'a': D.btnArchiveDrawer?.click(); break;
        case 'f': D.btnFeeds?.click(); break;
        case 't': toggleTheme(); break;
        case 'p': playPrevBriefing(); break;
        case 'n': playNextBriefing(); break;
        case 'm':
          if (D.audioElement) {
            D.audioElement.muted = !D.audioElement.muted;
            updateVolumeIcon();
            showToast(D.audioElement.muted ? '🔇 Muted' : '🔊 Unmuted');
          }
          break;
      }
    });

    // Command Palette Event Listeners
    if (D.btnCmdK) {
      D.btnCmdK.addEventListener('click', () => {
        if (D.cmdKModal && D.cmdKModal.classList.contains('active')) {
          closeCmdK();
        } else {
          openCmdK();
        }
      });
    }

    if (D.cmdKInput) {
      D.cmdKInput.addEventListener('input', e => {
        State.cmdKIndex = 0;
        renderCmdK(e.target.value);
      });

      D.cmdKInput.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (State.cmdKFilteredItems && State.cmdKFilteredItems.length > 0) {
            State.cmdKIndex = (State.cmdKIndex + 1) % State.cmdKFilteredItems.length;
            renderCmdK(D.cmdKInput.value);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (State.cmdKFilteredItems && State.cmdKFilteredItems.length > 0) {
            State.cmdKIndex = (State.cmdKIndex - 1 + State.cmdKFilteredItems.length) % State.cmdKFilteredItems.length;
            renderCmdK(D.cmdKInput.value);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          executeCmdKItem(State.cmdKIndex);
        } else if (e.key === 'Escape') {
          closeCmdK();
        }
      });
    }

    if (D.cmdKResults) {
      D.cmdKResults.addEventListener('click', e => {
        const item = e.target.closest('.cmd-k-item');
        if (item && item.dataset.cmdIdx !== undefined) {
          executeCmdKItem(parseInt(item.dataset.cmdIdx, 10));
        }
      });
    }

    // Close overlays on background click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) {
          modal.classList.remove('active');
          if (modal === D.cmdKModal) closeCmdK();
        }
      });
    });

    // Error Close
    if (D.btnCloseError) D.btnCloseError.addEventListener('click', hideError);

    // Theme Toggle
    if (D.btnThemeToggle) {
      D.btnThemeToggle.addEventListener('click', toggleTheme);
    }

    // Studio Settings Toggle
    if (D.btnStudioSettings) {
      D.btnStudioSettings.addEventListener('click', () => {
        if (D.studioSettingsRow) {
          const isHidden = D.studioSettingsRow.style.display === 'none';
          D.studioSettingsRow.style.display = isHidden ? 'flex' : 'none';
        }
      });
    }

    // Topic Chips
    D.chips.forEach(chip => {
      chip.addEventListener('click', () => {
        D.chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // Generate Button
    if (D.btnGenerateMain) D.btnGenerateMain.addEventListener('click', synthesize);

    // Carousel Navigation Chevrons
    if (D.btnStripScrollLeft && D.stripCarousel) {
      D.btnStripScrollLeft.addEventListener('click', () => {
        D.stripCarousel.scrollBy({ left: -300, behavior: 'smooth' });
      });
    }
    if (D.btnStripScrollRight && D.stripCarousel) {
      D.btnStripScrollRight.addEventListener('click', () => {
        D.stripCarousel.scrollBy({ left: 300, behavior: 'smooth' });
      });
    }
    if (D.stripCarousel) {
      D.stripCarousel.addEventListener('scroll', updateCarouselNavButtons);
      D.stripCarousel.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          D.stripCarousel.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }

    if (D.btnViewAllArchive) {
      D.btnViewAllArchive.addEventListener('click', () => {
        if (D.btnArchiveDrawer) D.btnArchiveDrawer.click();
      });
    }

    // Transport Player Controls
    if (D.btnPlayPause) D.btnPlayPause.addEventListener('click', () => togglePlay());
    if (D.btnPrevBrief) D.btnPrevBrief.addEventListener('click', playPrevBriefing);
    if (D.btnNextBrief) D.btnNextBrief.addEventListener('click', playNextBriefing);

    // Playback Speed Toggle
    if (D.btnSpeedToggle) {
      D.btnSpeedToggle.addEventListener('click', () => {
        State.speedIdx = (State.speedIdx + 1) % SPEEDS.length;
        const spd = SPEEDS[State.speedIdx];
        if (D.audioElement) D.audioElement.playbackRate = spd;
        D.btnSpeedToggle.textContent = `${spd.toFixed(1)}x`;
        showToast(`⚡ Playback speed: ${spd.toFixed(1)}x`);
      });
    }

    // Volume & Mute Controls
    if (D.volSlider) {
      D.volSlider.addEventListener('input', e => {
        if (D.audioElement) {
          D.audioElement.volume = parseFloat(e.target.value);
          D.audioElement.muted = false;
          updateVolumeIcon();
        }
      });
    }

    if (D.btnMuteToggle) {
      D.btnMuteToggle.addEventListener('click', () => {
        if (!D.audioElement) return;
        if (D.audioElement.volume > 0 && !D.audioElement.muted) {
          State.previousVolume = D.audioElement.volume;
          D.audioElement.volume = 0;
          if (D.volSlider) D.volSlider.value = 0;
          updateVolumeIcon();
          showToast('🔇 Muted');
        } else {
          D.audioElement.volume = State.previousVolume || 1;
          D.audioElement.muted = false;
          if (D.volSlider) D.volSlider.value = D.audioElement.volume;
          updateVolumeIcon();
          showToast('🔊 Unmuted');
        }
      });
    }

    // Audio Element Lifecycle Events
    if (D.audioElement) {
      D.audioElement.addEventListener('timeupdate', () => {
        if (D.currTime) D.currTime.textContent = formatTime(D.audioElement.currentTime);
        if (D.totalTime && D.audioElement.duration) D.totalTime.textContent = formatTime(D.audioElement.duration);
      });
      D.audioElement.addEventListener('loadedmetadata', () => {
        if (D.totalTime) D.totalTime.textContent = formatTime(D.audioElement.duration);
      });
      D.audioElement.addEventListener('ended', () => {
        State.isPlaying = false;
        updatePlayPauseUI();
        renderRecentStrip();
      });
      D.audioElement.addEventListener('play', () => {
        State.isPlaying = true;
        updatePlayPauseUI();
        renderRecentStrip();
      });
      D.audioElement.addEventListener('pause', () => {
        State.isPlaying = false;
        updatePlayPauseUI();
        renderRecentStrip();
      });
    }

    // Action Ribbon Buttons
    if (D.btnActionCopy) {
      D.btnActionCopy.addEventListener('click', () => {
        if (State.currentDigest?.markdown_report) {
          navigator.clipboard.writeText(State.currentDigest.markdown_report);
          showToast('📋 Strategic memo copied to clipboard');
        }
      });
    }

    if (D.btnActionPin) {
      D.btnActionPin.addEventListener('click', async () => {
        if (!State.currentDigest) return;
        const res = await api(`/api/digest/${State.currentDigest.id}/pin`, 'POST');
        if (res) {
          State.currentDigest.pinned = res.pinned;
          updatePinUI(res.pinned);
          const hi = State.history.find(h => String(h.id) === String(State.currentDigest.id));
          if (hi) hi.pinned = res.pinned;
          renderRecentStrip();
          showToast(res.pinned ? 'Briefing pinned' : 'Briefing unpinned');
        }
      });
    }

    if (D.btnActionQr) {
      D.btnActionQr.addEventListener('click', () => {
        if (!State.currentDigest) return;
        const streamUrl = location.origin + (State.currentDigest.audio_url || '');
        if (D.qrLinkInput) D.qrLinkInput.value = streamUrl;
        if (D.qrImage) D.qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(streamUrl)}`;
        openModal(D.qrModal);
      });
    }
    if (D.modalQrClose) D.modalQrClose.addEventListener('click', () => closeModal(D.qrModal));
    if (D.btnQrCopyLink) {
      D.btnQrCopyLink.addEventListener('click', () => {
        if (D.qrLinkInput) {
          navigator.clipboard.writeText(D.qrLinkInput.value);
          showToast('📋 Mobile stream URL copied');
        }
      });
    }

    if (D.btnActionReset) {
      D.btnActionReset.addEventListener('click', () => {
        loadLatestDigest();
        loadHistory();
        showToast('🔄 Briefing refreshed');
      });
    }

    // Tabs Switching
    D.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        D.tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = $(`tab-${btn.dataset.tab}`);
        if (pane) pane.classList.add('active');
      });
    });
    if (D.btnCopyTabContent) {
      D.btnCopyTabContent.addEventListener('click', () => {
        const active = document.querySelector('.tab-pane.active');
        if (active) {
          navigator.clipboard.writeText(active.innerText);
          showToast('📋 Tab content copied');
        }
      });
    }

    // Live News Modal
    if (D.btnLiveNews) D.btnLiveNews.addEventListener('click', () => { loadLiveNews(); openModal(D.liveNewsModal); });
    if (D.modalLiveClose) D.modalLiveClose.addEventListener('click', () => closeModal(D.liveNewsModal));
    if (D.btnRefreshLiveNews) D.btnRefreshLiveNews.addEventListener('click', loadLiveNews);
    if (D.liveNewsSearch) D.liveNewsSearch.addEventListener('input', renderLiveNews);
    D.liveChips.forEach(chip => {
      chip.addEventListener('click', () => {
        D.liveChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        State.liveCat = chip.dataset.cat;
        renderLiveNews();
      });
    });
    if (D.btnDigestVisible) {
      D.btnDigestVisible.addEventListener('click', () => {
        closeModal(D.liveNewsModal);
        if (D.customPromptInput) D.customPromptInput.value = 'Focus on the latest breaking headlines from the live RSS wire.';
        synthesize();
      });
    }

    // Archive Drawer
    if (D.btnArchiveDrawer) {
      D.btnArchiveDrawer.addEventListener('click', () => {
        State.archivePage = 1;
        State.archiveQuery = '';
        if (D.archiveSearch) D.archiveSearch.value = '';
        renderArchiveList();
        D.archiveDrawer.classList.toggle('active');
      });
    }
    if (D.btnCloseArchive) D.btnCloseArchive.addEventListener('click', () => closeModal(D.archiveDrawer));
    if (D.archiveSearch) D.archiveSearch.addEventListener('input', e => {
      State.archiveQuery = e.target.value;
      State.archivePage = 1;
      renderArchiveList();
    });
    if (D.archivePrevBtn) D.archivePrevBtn.addEventListener('click', () => { if (State.archivePage > 1) { State.archivePage--; renderArchiveList(); } });
    if (D.archiveNextBtn) D.archiveNextBtn.addEventListener('click', () => { State.archivePage++; renderArchiveList(); });

    // Feeds Modal
    if (D.btnFeeds) D.btnFeeds.addEventListener('click', () => { loadFeeds(); openModal(D.feedsModal); });
    if (D.modalClose) D.modalClose.addEventListener('click', () => closeModal(D.feedsModal));
    if (D.btnAddFeedRow) D.btnAddFeedRow.addEventListener('click', () => { State.feeds.push({ name: '', url: '', category: '' }); renderFeeds(); });
    if (D.btnResetFeeds) D.btnResetFeeds.addEventListener('click', () => { loadFeeds(); showToast('🔄 Feeds restored'); });
    if (D.btnSaveFeeds) {
      D.btnSaveFeeds.addEventListener('click', async () => {
        const rows = D.feedsContainer.querySelectorAll('.feed-row');
        const feeds = Array.from(rows).map(r => ({
          name: r.querySelector('.feed-name').value,
          url: r.querySelector('.feed-url').value,
          category: r.querySelector('.feed-cat')?.value || '',
        })).filter(f => f.url);
        const res = await api('/api/feeds', 'POST', feeds);
        if (res) {
          showToast('✅ Feeds saved successfully');
          closeModal(D.feedsModal);
        }
      });
    }
  }

  /* ================================================================
   * Start App
   * ================================================================ */
  init();
});
