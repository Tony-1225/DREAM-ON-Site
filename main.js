/* ============================================
   FILE TYPE : JS
   SITE      : DREAM ON! (ドリオン)
   VERSION   : 60
============================================ */
/* =============================================
   DREAM ON! – main.js
   JSONからコンテンツを動的に描画
   ============================================= */

(async () => {

  /* ---------- データ読み込み ---------- */
  let data;
  try {
    const res = await fetch('content.json?t=' + Date.now(), { cache: 'no-store' });
    data = await res.json();
  } catch (e) {
    console.error('content.json の読み込みに失敗しました:', e);
    return;
  }

  const { site, event, about, teams, timetable } = data;

  /* ---------- ページタイトル ---------- */
  document.title = `${site.title} Vol.${event.vol} – ${site.subtitle}`;

  /* ============================================================
     NAV
  ============================================================ */
  const navList = document.getElementById('nav-list');
  data.nav.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
    navList.appendChild(li);
  });

  /* ---- ハンバーガーメニュー ---- */
  const hamburger = document.getElementById('hamburger');
  const globalNav = document.getElementById('global-nav');

  hamburger.addEventListener('click', () => {
    const isOpen = globalNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  });

  // ナビリンクをタップしたら閉じる
  navList.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      globalNav.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });

  /* ============================================================
     HERO SLIDER
  ============================================================ */
  const sliderEl = document.getElementById('hero-slider');
  const dotsEl   = document.getElementById('hero-dots');
  const images   = data.hero_images;

  let currentSlide = 0;
  let slideInterval;

  // スライド生成
  const slides = images.map((src, i) => {
    const div = document.createElement('div');
    div.className = `hero-slide fallback-${i % 5}`;
    // 画像を試す
    const img = new Image();
    img.onload = () => {
      div.style.backgroundImage = `url('${src}')`;
      div.classList.remove(`fallback-${i % 5}`);
    };
    img.onerror = () => {
      console.error('画像が読み込めません:', src);
    };
    img.src = src;
    sliderEl.appendChild(div);
    return div;
  });

  // ドット生成
  images.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'hero-dot';
    btn.setAttribute('aria-label', `スライド ${i + 1}`);
    btn.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(btn);
  });

  const dots = dotsEl.querySelectorAll('.hero-dot');

  function goTo(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  function startAutoplay() {
    slideInterval = setInterval(() => goTo(currentSlide + 1), 5000);
  }

  goTo(0);
  startAutoplay();

  // タッチスワイプ
  let touchStartX = 0;
  sliderEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  sliderEl.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      clearInterval(slideInterval);
      goTo(diff > 0 ? currentSlide + 1 : currentSlide - 1);
      startAutoplay();
    }
  });

  /* ---- ヒーロー イベント情報 ---- */
  document.getElementById('hero-vol-badge').textContent =
    `Vol.${event.vol} — ${event.anniversary}`;

  /* ============================================================
     PHASE（エントリー状態の切り替え）
  ============================================================ */
  const phase = data.phase || '2';
  const pt = (data.phase_text && data.phase_text[phase]) || { headline: '', note: '' };

  // フェーズ0（公開前・次回未定）では開催日・会場は非表示
  document.getElementById('hero-info').innerHTML = (phase === '0') ? '' : `
    <div class="event-date">${event.date}</div>
    <div class="event-venue">@ ${event.venue} / ${event.open} / ${event.start}</div>
  `;
  const phaseEl = document.getElementById('hero-phase');
  const ctaEl = document.getElementById('hero-cta');
  const entryFormUrl = data.entry_form_url || 'mailto:k-dancefes@shibuya-o.com';

  // フェーズ表示（見出し＋補足＋必要ならカウントダウン）
  let phaseHTML = '';

  if (phase === '0') {
    // フェーズ0：開催日・会場・エントリー日・カウントダウンは全て非表示、COMING SOONのみ
    phaseHTML += `<div class="phase-headline phase-${phase}">${pt.headline}</div>`;
  }
  if (phase === '1') {
    // 開催日テキスト表示
    if (event.date) {
      phaseHTML += `<p class="phase-event-date">開催日：${event.date}</p>`;
    }
    // 見出し（カウントダウンの上に配置）
    phaseHTML += `<div class="phase-headline phase-${phase}">${pt.headline}</div>`;
    // エントリーまでDaysカウントダウン
    if (data.entry_open_date) {
      phaseHTML += `<div class="phase-countdown" id="phase-countdown"></div>`;
    }
  }
  if (phase === '2' && data.entry_close_date) {
    const closeDate = data.entry_close_date ? new Date(data.entry_close_date) : null;
    const closeDateStr = closeDate ? `${closeDate.getMonth()+1}/${closeDate.getDate()}` : '';
    phaseHTML += `<p class="phase-cd-label">エントリー締切[${closeDateStr}]まで</p><div class="phase-countdown" id="phase-countdown"></div>`;
  }
  if (phase === '4' && data.event_datetime) {
    phaseHTML += `<p class="phase-cd-label">本番まで</p><div class="phase-countdown" id="phase-countdown"></div>`;
  }

  // 見出し（カウントダウンの後に統一。フェーズ0/1はカウントダウンの上に配置済み）
  if (phase !== '1' && phase !== '0') {
    phaseHTML += `<div class="phase-headline phase-${phase}">${pt.headline}</div>`;
  }

  phaseHTML += `<div class="phase-note">${pt.note}</div>`;
  phaseEl.innerHTML = phaseHTML;

  // ボタンの出し分け
  let ctaHTML = '';
  if (phase === '2') {
    ctaHTML = `
      <a href="${entryFormUrl}" class="btn btn-primary">エントリーはこちら</a>
      <a href="#about" class="btn btn-outline">詳しく見る</a>`;
  } else if (phase === '4') {
    ctaHTML = `
      <a href="#teams" class="btn btn-primary">出演チームを見る</a>`;
  } else if (phase === '3') {
    // フェーズ3：CTAなし
    ctaHTML = '';
  } else {
    ctaHTML = `
      <span class="btn btn-disabled">エントリー開始までお待ちください</span>
      <a href="#about" class="btn btn-outline">詳しく見る</a>`;
  }
  ctaEl.innerHTML = ctaHTML;

  // カウントダウン処理
  const cdTarget = phase === '1' ? data.entry_open_date
                 : phase === '2' ? data.entry_close_date
                 : phase === '4' ? data.event_datetime
                 : null;
  if (cdTarget) {
    const target = new Date(cdTarget).getTime();
    const cdEl = document.getElementById('phase-countdown');
    const updateCountdown = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        cdEl.style.display = 'none';
        if (phase === '1') cdEl.innerHTML = `<span class="cd-open">まもなくエントリー開始！</span>`;
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      cdEl.innerHTML = `
        <div class="cd-box"><span class="cd-num">${d}</span><span class="cd-unit">DAYS</span></div>
        <div class="cd-box"><span class="cd-num">${String(h).padStart(2,'0')}</span><span class="cd-unit">HOUR</span></div>
        <div class="cd-box"><span class="cd-num">${String(m).padStart(2,'0')}</span><span class="cd-unit">MIN</span></div>
        <div class="cd-box"><span class="cd-num">${String(s).padStart(2,'0')}</span><span class="cd-unit">SEC</span></div>
      `;
    };
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  document.getElementById('about-lead').innerHTML = about.lead.replace(/\n/g, '<br>');
  document.getElementById('about-video-iframe').src = event.youtube_embed;

  // U-18 アカデミーブロック（出演チーム一覧セクション内）
  if (data.u18) {
    const u18El = document.getElementById('u18-section');
    if (u18El) {
      document.getElementById('u18-title').textContent = data.u18.title;
      document.getElementById('u18-body').textContent = data.u18.body;
    }
  }

  /* ============================================================
     TIMETABLE
  ============================================================ */
  document.getElementById('timetable-header').innerHTML = `
    <div class="tt-date">${event.date}</div>
    <div class="tt-venue">${event.venue} / ${event.open} – ${event.start}</div>
  `;

  const ttList = document.getElementById('timetable-list');
  if (!timetable || timetable.length === 0) {
    ttList.innerHTML = `
      <div class="coming-soon-box reveal">
        <div class="coming-soon-text">COMING SOON</div>
        <div class="coming-soon-sub">タイムテーブルは決まり次第発表いたします</div>
      </div>`;
  } else {
    timetable.forEach(row => {
      const isDJ = row.act.includes('DJ') || row.act.includes('OPEN') || row.act.includes('START');
      const div = document.createElement('div');
      div.className = `tt-row reveal${isDJ ? ' dj' : ''}`;
      div.innerHTML = `
        <div class="tt-time">${row.time}</div>
        <div class="tt-act">${row.act}</div>
      `;
      ttList.appendChild(div);
    });
  }

  /* ============================================================
     TEAMS（通常ブロック／U-18ブロック）
  ============================================================ */
  const teamsGrid = document.getElementById('teams-grid');
  teams.forEach(name => {
    const card = document.createElement('div');
    card.className = 'team-card reveal';
    card.innerHTML = `<span>${name}</span>`;
    teamsGrid.appendChild(card);
  });

  const teamsU18Grid = document.getElementById('teams-u18-grid');
  const teamsU18 = data.teams_u18 || [];
  teamsU18.forEach(name => {
    const card = document.createElement('div');
    card.className = 'team-card reveal';
    card.innerHTML = `<span>${name}</span>`;
    teamsU18Grid.appendChild(card);
  });

  /* ============================================================
     ENTRY（フェーズ対応）
  ============================================================ */
  const entryContent = document.getElementById('entry-content');
  const ept = (data.phase_text && data.phase_text[phase]) || {};
  const entryHeadline = ept.entry_headline || '';
  const entryNote = ept.entry_note || '';

  if (phase === '2') {
    // フェーズ2：受付中
    let closeCdHtml = '';
    if (data.entry_close_date) {
      closeCdHtml = `
        <p class="entry-event-cd-label">エントリー締切まで</p>
        <div class="entry-countdown" id="entry-close-countdown"></div>`;
    }
    entryContent.innerHTML = `
      <p class="entry-lead">${entryHeadline}</p>
      ${closeCdHtml}
      <div class="entry-steps">
        <div class="entry-step">
          <div class="step-num">01</div>
          <div class="step-text"><strong>動画を撮影</strong><span>カバーするK-POPアーティストの楽曲でダンス動画を撮影</span></div>
        </div>
        <div class="entry-step">
          <div class="step-num">02</div>
          <div class="step-text"><strong>フォームから応募</strong><span>下記フォームに必要事項を入力して送信</span></div>
        </div>
        <div class="entry-step">
          <div class="step-num">03</div>
          <div class="step-text"><strong>審査・結果通知</strong><span>動画審査を経て出演チームを決定、メールにてご連絡</span></div>
        </div>
      </div>
      <a href="${entryFormUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-large">エントリーする</a>
      <p class="entry-note">※現在のエントリー状況はSNSをご確認ください</p>
    `;
    if (data.entry_close_date) {
      const target = new Date(data.entry_close_date).getTime();
      const ecEl = document.getElementById('entry-close-countdown');
      const update = () => {
        const diff = target - Date.now();
        if (diff <= 0) { ecEl.style.display='none'; return; }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        ecEl.innerHTML = `
          <div class="entry-cd-wrap">
            <div class="entry-cd-box"><span class="entry-cd-num">${d}</span><span class="entry-cd-unit">DAYS</span></div>
            <div class="entry-cd-box"><span class="entry-cd-num">${String(h).padStart(2,'0')}</span><span class="entry-cd-unit">HOUR</span></div>
            <div class="entry-cd-box"><span class="entry-cd-num">${String(m).padStart(2,'0')}</span><span class="entry-cd-unit">MIN</span></div>
            <div class="entry-cd-box"><span class="entry-cd-num">${String(s).padStart(2,'0')}</span><span class="entry-cd-unit">SEC</span></div>
          </div>`;
      };
      update(); setInterval(update, 1000);
    }

  } else if (phase === '1') {
    // フェーズ1：開始前
    let cdHtml = '';
    if (data.entry_open_date) {
      cdHtml = `<div class="entry-countdown" id="entry-countdown"></div>`;
    }
    entryContent.innerHTML = `
      <p class="entry-lead">${entryHeadline}</p>
      ${cdHtml}
      <p class="entry-note" style="white-space:pre-line">${entryNote}</p>
    `;
    // カウントダウン
    if (data.entry_open_date) {
      const target = new Date(data.entry_open_date).getTime();
      const ecEl = document.getElementById('entry-countdown');
      const update = () => {
        const diff = target - Date.now();
        if (diff <= 0) { ecEl.innerHTML = `<p class="entry-cd-open">まもなくエントリー開始！</p>`; return; }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        ecEl.innerHTML = `
          <div class="entry-cd-wrap">
            <div class="entry-cd-box"><span class="entry-cd-num">${d}</span><span class="entry-cd-unit">DAYS</span></div>
            <div class="entry-cd-box"><span class="entry-cd-num">${String(h).padStart(2,'0')}</span><span class="entry-cd-unit">HOUR</span></div>
            <div class="entry-cd-box"><span class="entry-cd-num">${String(m).padStart(2,'0')}</span><span class="entry-cd-unit">MIN</span></div>
            <div class="entry-cd-box"><span class="entry-cd-num">${String(s).padStart(2,'0')}</span><span class="entry-cd-unit">SEC</span></div>
          </div>`;
      };
      update(); setInterval(update, 1000);
    }

  } else if (phase === '3') {
    // フェーズ3：ENTRYセクション自体を非表示
    const entrySection = document.getElementById('entry');
    if (entrySection) entrySection.style.display = 'none';
    // NAVのENTRYリンクも非表示
    document.querySelectorAll('#nav-list a').forEach(a => {
      if (a.getAttribute('href') === '#entry') {
        a.parentElement.style.display = 'none';
      }
    });

  } else if (phase === '4') {
    // フェーズ4：ENTRYセクション自体を非表示（本番までのカウントダウンはヒーローに既存）
    const entrySection4 = document.getElementById('entry');
    if (entrySection4) entrySection4.style.display = 'none';
    document.querySelectorAll('#nav-list a').forEach(a => {
      if (a.getAttribute('href') === '#entry') {
        a.parentElement.style.display = 'none';
      }
    });
  } else if (phase === '0') {
    // フェーズ0：公開前・次回未定のためENTRY・出演者チーム・タイムテーブルを全て非表示
    ['entry', 'teams', 'timetable'].forEach(id => {
      const section = document.getElementById(id);
      if (section) section.style.display = 'none';
    });
    document.querySelectorAll('#nav-list a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === '#entry' || href === '#teams' || href === '#timetable') {
        a.parentElement.style.display = 'none';
      }
    });
  }

  /* ============================================================
     Q&A アコーディオン（カテゴリ対応）
  ============================================================ */
  const qaCategoriesEl = document.getElementById('qa-categories');
  const qaCategories = data.qa_categories || [];
  let qaGlobalIndex = 0;
  qaCategories.forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.className = 'qa-category';
    const catTitle = document.createElement('h3');
    catTitle.className = 'qa-category-title';
    catTitle.textContent = cat.title;
    catDiv.appendChild(catTitle);

    const listDiv = document.createElement('div');
    listDiv.className = 'qa-list';

    cat.items.forEach(item => {
      const i = qaGlobalIndex++;
      const div = document.createElement('div');
      div.className = 'qa-item reveal';
      div.innerHTML = `
        <button class="qa-question" aria-expanded="false" aria-controls="qa-answer-${i}">
          <span class="qa-q-icon">Q</span>
          <span>${item.q}</span>
          <span class="qa-chevron">▼</span>
        </button>
        <div class="qa-answer" id="qa-answer-${i}" role="region">
          <div class="qa-answer-inner">${item.a}</div>
        </div>
      `;
      const btn = div.querySelector('.qa-question');
      btn.addEventListener('click', () => {
        const isOpen = div.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
      });
      listDiv.appendChild(div);
    });

    catDiv.appendChild(listDiv);
    qaCategoriesEl.appendChild(catDiv);
  });

  /* ============================================================
     FOOTER SOCIAL
  ============================================================ */
  const socialIcons = {
    youtube:   { icon: '<i class="fa-brands fa-youtube"></i>', label: 'YouTube' },
    twitter:   { icon: '<i class="fa-brands fa-x-twitter"></i>', label: 'X (Twitter)' },
    instagram: { icon: '<i class="fa-brands fa-instagram"></i>', label: 'Instagram' },
    facebook:  { icon: '<i class="fa-brands fa-facebook-f"></i>', label: 'Facebook' },
  };

  const footerSocial = document.getElementById('footer-social');
  Object.entries(site.social).forEach(([key, url]) => {
    if (!url) return;
    const s = socialIcons[key] || { icon: '<i class="fa-solid fa-link"></i>', label: key };
    const a = document.createElement('a');
    a.className = 'social-link';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', s.label);
    a.innerHTML = s.icon;
    footerSocial.appendChild(a);
  });

  const footerBuildEl = document.getElementById('footer-build');
  if (footerBuildEl) {
    const buildVersion = (data._meta && data._meta.version) || '?';
    footerBuildEl.textContent = `v${buildVersion} / phase ${phase}`;
  }

  /* ============================================================
     SCROLL REVEAL (IntersectionObserver)
  ============================================================ */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  // 少し遅延して要素を登録（DOM挿入後）
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 8) * 0.05}s`;
      observer.observe(el);
    });
  }, 100);

  /* ============================================================
     HEADER スクロール時の影
  ============================================================ */
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 10
      ? '0 2px 20px rgba(0,0,0,0.12)'
      : 'none';
  }, { passive: true });

})();

/* ============================================
   FILE TYPE : JS
   SITE      : DREAM ON! (ドリオン)
   VERSION   : 60
============================================ */
