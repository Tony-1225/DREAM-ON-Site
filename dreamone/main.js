/* ============================================
   FILE TYPE : JS
   SITE      : DREAM ONE! (ドリワン)
   VERSION   : 53
============================================ */
(async () => {
  let data;
  try {
    const res = await fetch('content.json?t=' + Date.now(), { cache: 'no-store' });
    data = await res.json();
  } catch (e) {
    console.error('content.json の読み込みに失敗しました:', e);
    return;
  }

  const { site, event, about, rules, teams, timetable, qa } = data;

  document.title = `${site.title} Vol.${event.vol} – ${site.subtitle}`;

  // NAV
  const navList = document.getElementById('nav-list');
  data.nav.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
    navList.appendChild(li);
  });

  const hamburger = document.getElementById('hamburger');
  const globalNav = document.getElementById('global-nav');
  hamburger.addEventListener('click', () => {
    const isOpen = globalNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
  });
  navList.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      globalNav.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });

  // パーティクル
  const particlesEl = document.getElementById('hero-particles');
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    const colors = ['rgba(255,255,255,0.95)', 'rgba(91,200,245,0.95)', 'rgba(244,114,182,0.9)', 'rgba(251,191,36,0.85)'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${color};
      animation-duration: ${Math.random() * 8 + 5}s;
      animation-delay: ${Math.random() * 6}s;
      opacity: 0;
      box-shadow: 0 0 ${size * 2}px ${color};
    `;
    particlesEl.appendChild(p);
  }

  // ヒーロー背景スライダー（hero_imagesがあれば表示）
  const sliderEl = document.getElementById('hero-slider');
  const images = data.hero_images || [];
  if (sliderEl && images.length > 0) {
    let current = 0;
    const slides = images.map((src, i) => {
      const div = document.createElement('div');
      div.className = 'hero-slide';
      const img = new Image();
      img.onload = () => { div.style.backgroundImage = `url('${src}')`; };
      img.src = src;
      sliderEl.appendChild(div);
      return div;
    });
    slides[0].classList.add('active');
    if (slides.length > 1) {
      setInterval(() => {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
      }, 5000);
    }
  }

  // HERO
  document.getElementById('hero-catchcopy').textContent = event.catchcopy;
  document.getElementById('hero-vol-badge').textContent = `Vol.${event.vol} — ${event.anniversary}`;
  document.getElementById('hero-info').innerHTML = `
    <div class="event-date">${event.date}</div>
    <div class="event-venue">@ ${event.venue}</div>
  `;

  /* ============================================================
     PHASE（フェーズ切り替え）
  ============================================================ */
  const phase = data.phase || '2';
  const pt = (data.phase_text && data.phase_text[phase]) || { headline: '', note: '' };
  const phaseEl = document.getElementById('hero-phase');
  const ctaEl = document.getElementById('hero-cta');
  const entryFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScut_B53liM6_Qmbw9drS_c9zeNsbkM3y58yw0ty579HDa0Cw/viewform';

  // フェーズ2のときだけエントリーで出演確約バッジを表示
  let phaseHTML = '';
  if (phase === '2') {
    phaseHTML += `<div class="hero-entry-badge">✨ エントリーで出演確約 ✨</div>`;
  }
  phaseHTML += `<div class="phase-headline phase-${phase}">${pt.headline}</div>`;
  if (phase === '1') {
    if (data.entry_open_date) {
      phaseHTML += `<p class="phase-cd-label">エントリー開始まで</p><div class="phase-countdown" id="phase-countdown"></div>`;
    }
  }
  if (phase === '2' && data.entry_close_date) {
    phaseHTML += `<p class="phase-cd-label">エントリー締切まで</p><div class="phase-countdown" id="phase-countdown"></div>`;
  }
  if (phase === '4' && data.event_datetime) {
    phaseHTML += `<a href="#teams" class="btn btn-primary" style="margin:12px auto 4px;display:inline-flex;">出場サークルを見る</a>`;
    phaseHTML += `<p class="phase-cd-label">本番まで</p><div class="phase-countdown" id="phase-countdown"></div>`;
  }
  if (phase !== '1') {
    phaseHTML += `<div class="phase-note">${pt.note}</div>`;
  }
  phaseEl.innerHTML = phaseHTML;

  // ボタン出し分け
  let ctaHTML = '';
  if (phase === '2') {
    ctaHTML = `
      <a href="${entryFormUrl}" target="_blank" rel="noopener" class="btn btn-primary">エントリーはこちら</a>
      <a href="#about" class="btn btn-outline">詳しく見る</a>`;
  } else if (phase === '4') {
    ctaHTML = ``; // フェーズ4はヒーロー内ボタンで完結
  } else {
    ctaHTML = `
      <span class="btn btn-disabled">${phase === '1' ? 'エントリー開始までお待ちください' : 'エントリー受付は終了しました'}</span>
      <a href="#about" class="btn btn-outline">詳しく見る</a>`;
  }
  ctaEl.innerHTML = ctaHTML;

  // カウントダウン
  const cdTarget = phase === '1' ? data.entry_open_date
                 : phase === '2' ? data.entry_close_date
                 : phase === '4' ? data.event_datetime
                 : null;
  if (cdTarget) {
    const target = new Date(cdTarget).getTime();
    const cdEl = document.getElementById('phase-countdown');
    const daysOnly = (phase === '1'); // フェーズ1のみDays表示、フェーズ4は秒数まで
    const updateCd = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        cdEl.style.display = 'none';
        if (phase === '1') cdEl.innerHTML = `<span class="cd-open">まもなくエントリー開始！</span>`;
        if (phase === '4') cdEl.innerHTML = `<span class="cd-open">本日開催！</span>`;
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (daysOnly) {
        cdEl.innerHTML = `<div class="cd-box cd-box-large"><span class="cd-num">${d}</span><span class="cd-unit">DAYS</span></div>`;
      } else {
        cdEl.innerHTML = `
          <div class="cd-box"><span class="cd-num">${d}</span><span class="cd-unit">DAYS</span></div>
          <div class="cd-box"><span class="cd-num">${String(h).padStart(2,'0')}</span><span class="cd-unit">HOUR</span></div>
          <div class="cd-box"><span class="cd-num">${String(m).padStart(2,'0')}</span><span class="cd-unit">MIN</span></div>
          <div class="cd-box"><span class="cd-num">${String(s).padStart(2,'0')}</span><span class="cd-unit">SEC</span></div>
        `;
      }
    };
    if (daysOnly) setInterval(updateCd, 60000);
    else setInterval(updateCd, 1000);
    updateCd();
  }

  // ABOUT
  document.getElementById('about-lead').textContent = about.lead;
  document.getElementById('about-body').textContent = about.body;

  const featuresGrid = document.getElementById('features-grid');
  about.features.forEach(f => {
    const card = document.createElement('div');
    card.className = 'feature-card reveal';
    card.innerHTML = `
      <div class="feature-icon">${f.icon}</div>
      <div class="feature-title">${f.title}</div>
      <div class="feature-desc">${f.desc}</div>
    `;
    featuresGrid.appendChild(card);
  });

  // RULES
  const rulesGrid = document.getElementById('rules-grid');
  Object.values(rules).forEach(rule => {
    const card = document.createElement('div');
    card.className = 'rule-card reveal';
    const itemsHTML = rule.items.map(i => `<div class="rule-item">${i}</div>`).join('');
    card.innerHTML = `
      <div class="rule-title">${rule.title}</div>
      <div class="rule-items">${itemsHTML}</div>
    `;
    rulesGrid.appendChild(card);
  });

  // ENTRY（フェーズ対応）
  const entryContent = document.getElementById('entry-content');
  const ept = (data.phase_text && data.phase_text[phase]) || {};
  const entryHeadline = ept.entry_headline || '';
  const entryNote = ept.entry_note || '';

  if (phase === '2') {
    // フェーズ2：受付中（締切カウントダウン付き）
    let closeCdHtml = '';
    if (data.entry_close_date) {
      closeCdHtml = `
        <p class="entry-event-cd-label">エントリー締切まで</p>
        <div class="entry-countdown" id="entry-close-countdown"></div>`;
    }
    entryContent.innerHTML = `
      <div class="entry-badge-large">✨ エントリーで出演確約 ✨</div>
      <p class="entry-lead">${entryHeadline}</p>
      ${closeCdHtml}
      <div class="entry-steps">
        <div class="entry-step">
          <div class="step-num">01</div>
          <div class="step-text"><strong>チームを集める</strong><span>同じ大学・インカレサークルのメンバーで参加</span></div>
        </div>
        <div class="entry-step">
          <div class="step-num">02</div>
          <div class="step-text"><strong>フォームから応募</strong><span>エントリーフォームに必要事項を入力して送信</span></div>
        </div>
        <div class="entry-step">
          <div class="step-num">03</div>
          <div class="step-text"><strong>出演確約！</strong><span>エントリー完了で即ステージ出演が確定</span></div>
        </div>
      </div>
      <a href="${entryFormUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-large">エントリーフォームへ</a>
      <p class="entry-note">お問い合わせ：SNS（X / Instagram）よりDMにてご連絡ください</p>
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
      cdHtml = `<div class="entry-countdown" id="entry-open-countdown"></div>`;
    }
    entryContent.innerHTML = `
      <p class="entry-lead">${entryHeadline}</p>
      ${cdHtml}
      <p class="entry-note" style="white-space:pre-line">${entryNote}</p>
    `;
    if (data.entry_open_date) {
      const target = new Date(data.entry_open_date).getTime();
      const ecEl = document.getElementById('entry-open-countdown');
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
    // フェーズ3：締切・審査中
    entryContent.innerHTML = `
      <div class="entry-phase-msg">
        <p class="entry-lead">${entryHeadline}</p>
        <p class="entry-note" style="white-space:pre-line">${entryNote}</p>
      </div>
    `;

  } else if (phase === '4') {
    // フェーズ4：ENTRYセクションを非表示
    const entrySection = document.getElementById('entry');
    if (entrySection) entrySection.style.display = 'none';
    // NAVのENTRYリンクも非表示
    document.querySelectorAll('#nav-list a').forEach(a => {
      if (a.getAttribute('href') === '#entry') {
        a.parentElement.style.display = 'none';
      }
    });
  }

  // TIMETABLE
  document.getElementById('timetable-header').innerHTML = `
    <div class="tt-date">${event.date}</div>
    <div class="tt-venue">${event.venue}</div>
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
      const isSpecial = row.act.includes('OPEN') || row.act.includes('START') || row.act.includes('FINALE') || row.act.includes('表彰');
      const div = document.createElement('div');
      div.className = `tt-row reveal${isSpecial ? ' dj' : ''}`;
      div.innerHTML = `<div class="tt-time">${row.time}</div><div class="tt-act">${row.act}</div>`;
      ttList.appendChild(div);
    });
  }

  // TEAMS
  const teamsGrid = document.getElementById('teams-grid');
  if (!teams || teams.length === 0) {
    teamsGrid.innerHTML = `
      <div class="coming-soon-box reveal">
        <div class="coming-soon-text">COMING SOON</div>
        <div class="coming-soon-sub">出場サークルは決まり次第発表いたします</div>
      </div>`;
  } else {
    // サークル名AtoZで並び替え（大学名を除いたサークル名部分で比較）
    const sortedTeams = [...teams].sort((a, b) => {
      const nameA = a.includes(' ') ? a.split(' ').slice(1).join(' ') : a;
      const nameB = b.includes(' ') ? b.split(' ').slice(1).join(' ') : b;
      return nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
    });
    sortedTeams.forEach(name => {
      const card = document.createElement('div');
      card.className = 'team-card reveal';
      card.innerHTML = `<span>${name}</span>`;
      teamsGrid.appendChild(card);
    });
    // AtoZラベル
    const teamsSection = document.getElementById('teams');
    if (teamsSection) {
      const atoz = document.createElement('p');
      atoz.className = 'teams-note';
      atoz.textContent = '(サークル名 A to Z)';
      teamsSection.querySelector('.section-inner').appendChild(atoz);
    }
  }

  // Q&A
  const qaList = document.getElementById('qa-list');
  qa.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'qa-item reveal';
    div.innerHTML = `
      <button class="qa-question" aria-expanded="false">
        <span class="qa-q-icon">Q</span>
        <span>${item.q}</span>
        <span class="qa-chevron">▼</span>
      </button>
      <div class="qa-answer"><div class="qa-answer-inner">${item.a}</div></div>
    `;
    div.querySelector('.qa-question').addEventListener('click', () => {
      const isOpen = div.classList.toggle('open');
      div.querySelector('.qa-question').setAttribute('aria-expanded', isOpen);
    });
    qaList.appendChild(div);
  });

  // JUDGES（審査員）
  const judgesGrid = document.getElementById('judges-grid');
  const judges = data.judges || [];
  if (judges.length === 0) {
    judgesGrid.innerHTML = `
      <div class="coming-soon-box reveal">
        <div class="coming-soon-text">COMING SOON</div>
        <div class="coming-soon-sub">審査員は決まり次第発表いたします</div>
      </div>`;
  } else {
    judges.forEach((judge, i) => {
      const card = document.createElement('div');
      card.className = 'judge-card reveal';
      // 画像：存在すれば表示、なければイニシャル
      const initial = judge.name.charAt(0);
      card.innerHTML = `
        <div class="judge-img-wrap">
          <img class="judge-img" src="${judge.image}" alt="${judge.name}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="judge-img-placeholder" style="display:none">${initial}</div>
        </div>
        <div class="judge-name">${judge.name}</div>
      `;
      card.addEventListener('click', () => openJudgePopup(judge));
      judgesGrid.appendChild(card);
    });
  }

  // ポップアップ処理
  const overlay = document.getElementById('judge-popup-overlay');
  const popupClose = document.getElementById('judge-popup-close');

  function openJudgePopup(judge) {
    document.getElementById('judge-popup-img').src = judge.image;
    document.getElementById('judge-popup-img').alt = judge.name;
    document.getElementById('judge-popup-img').onerror = function() { this.style.display='none'; };
    document.getElementById('judge-popup-name').textContent = judge.name;
    document.getElementById('judge-popup-profile').textContent = judge.profile;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeJudgePopup() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  popupClose.addEventListener('click', closeJudgePopup);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeJudgePopup(); });

  // フェーズ4：セクション順序並べ替え＋NAVリンク更新
  if (phase === '4') {
    const main = document.getElementById('main-content');
    if (main) {
      const order = ['teams', 'timetable', 'judges', 'rules', 'about', 'qa'];
      order.forEach(id => {
        const el = document.getElementById(id);
        if (el) main.appendChild(el);
      });
    }
    // NAVリンクをフェーズ4用に更新
    const navList = document.getElementById('nav-list');
    navList.innerHTML = '';
    const phase4Nav = [
      { label: 'TEAMS', href: '#teams' },
      { label: 'TIMETABLE', href: '#timetable' },
      { label: 'JUDGES', href: '#judges' },
      { label: 'RULES', href: '#rules' },
      { label: 'ABOUT', href: '#about' },
      { label: 'Q&A', href: '#qa' },
    ];
    phase4Nav.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
      navList.appendChild(li);
    });
  }

  // SOCIAL
  const socialIcons = {
    youtube:   { icon: '<i class="fa-brands fa-youtube"></i>', label: 'YouTube' },
    twitter:   { icon: '<i class="fa-brands fa-x-twitter"></i>', label: 'X' },
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

  // SCROLL REVEAL
  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 8) * 0.05}s`;
      observer.observe(el);
    });
  }, 100);

  // HEADER SHADOW
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,100,255,0.2)' : 'none';
  }, { passive: true });

})();

/* ============================================
   FILE TYPE : JS
   SITE      : DREAM ONE! (ドリワン)
   VERSION   : 53
============================================ */
