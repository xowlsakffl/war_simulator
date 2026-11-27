(() => {
  'use strict';
  const { countries, events, sources } = window.PANDO_DATA;
  const $ = (id) => document.getElementById(id);
  const esc = (text) =>
    String(text ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const days = [18, 62, 103],
    endDay = 150,
    storageKey = 'pando-475-session-v1';
  const metricNames = { grain: '곡물', trust: '민심', trade: '교역' };
  const targets = {
    goguryeo: ['trust', 60],
    baekje: ['grain', 52],
    silla: ['trade', 62],
  };
  const symbol = { goguryeo: '✦', baekje: '◇', silla: '☼' },
    levels = { easy: '입문', normal: '보통', hard: '어려움' };
  const policy = {
    relief: {
      name: '구휼',
      words:
        /구휼|구호|배급|나누|나눠|나눔|풀어|푼다|면제|백성에게|백성들에|기부|구제|돕|도와|분배|나눈/g,
      delta: { grain: -9, trust: 12, trade: 1 },
      influence: 1,
    },
    trade: {
      name: '교역',
      words:
        /교역|거래|수출|수입|교환|맞바|무역|장터|장날|상인|장사|사절|외교|장꾼|나루|매입/g,
      delta: { grain: -4, trust: 2, trade: 11 },
      influence: 2,
    },
    reserve: {
      name: '비축',
      words:
        /비축|저장|징수|보관|저축|수확|곡간|모아|채운|채워|아껴|농사|경작|개간|재배/g,
      delta: { grain: 11, trust: -3, trade: -2 },
      influence: 0,
    },
    council: {
      name: '협의',
      words:
        /협의|회의|의논|귀족|협상|합의|주민|마을.*대표|설득|의견|조정|상의/g,
      delta: { grain: -3, trust: 9, trade: 3 },
      influence: 1,
    },
    diplomacy: {
      name: '외교',
      words: /동맹|화친|휴전|사신|사절단|수교|조약|외교|우호|정전/g,
      delta: { grain: -3, trust: 5, trade: 8 },
      influence: 1,
    },
    defense: {
      name: '수비',
      words:
        /수비|수성|방어|성벽|보수|요새|방비|주둔|경계|성곽|지켜|지킨|지키|성을\s*쌓|보강|축성/g,
      delta: { grain: -7, trust: 6, trade: -1 },
      influence: 2,
    },
    advance: {
      name: '세력 확대',
      words:
        /진출|세력|진군|전진|진격|영역|확장|공격|점령|공세|출정|병력|군사를|파병|군대를|정복/g,
      delta: { grain: -10, trust: -3, trade: 2 },
      influence: 3,
    },
  };
  function fresh(id = 'baekje', speed = 2, difficulty = 'normal') {
    return {
      country: id,
      speed,
      difficulty,
      phase: 'setup',
      day: 0,
      index: 0,
      stats: { ...countries[id].resources },
      orders: [],
      log: [],
    };
  }
  let s = fresh(),
    tab = 'command',
    custom = false,
    detailOpen = false,
    lastFrame = 0,
    lastDraw = 0,
    raf = 0,
    modalAction = null;
  function save() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(s));
    } catch {}
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (
      saved &&
      countries[saved.country] &&
      levels[saved.difficulty] &&
      [1, 2, 4].includes(saved.speed) &&
      ['setup', 'running', 'paused', 'event', 'done'].includes(saved.phase) &&
      Number.isFinite(saved.day) &&
      saved.day >= 0 &&
      saved.day <= endDay &&
      Array.isArray(saved.orders) &&
      Array.isArray(saved.log) &&
      ['grain', 'trust', 'trade'].every((k) =>
        Number.isFinite(saved.stats?.[k]),
      ) &&
      Number.isInteger(saved.index) &&
      saved.index >= 0 &&
      saved.index <= 3 &&
      !(saved.phase === 'event' && saved.index === 3)
    ) {
      s = saved;
      if (s.phase === 'running') s.phase = 'paused';
    }
  } catch {}
  function calendar(day) {
    const d = new Date(0);
    d.setUTCFullYear(475, 11, 1 + Math.floor(day));
    const m = d.getUTCMonth() + 1;
    return {
      year: d.getUTCFullYear(),
      month: m,
      date: d.getUTCDate(),
      season:
        m === 12 || m < 3 ? '겨울' : m < 6 ? '봄' : m < 9 ? '여름' : '가을',
    };
  }
  function stamp(day) {
    const d = calendar(day);
    return d.year + '년 ' + d.month + '월 ' + d.date + '일';
  }
  const current = () => countries[s.country];
  const incident = () => events[s.country][s.index];
  function notify(text) {
    $('announce').textContent = text;
  }
  function journal(title, body) {
    s.log.push({ day: s.day, title, body });
  }
  function setNation(id) {
    if (s.phase !== 'setup' || !countries[id]) return;
    s = fresh(id, s.speed, s.difficulty);
    tab = 'command';
    detailOpen = false;
    save();
    draw();
    paint();
    notify(countries[id].name + ' 선택');
  }
  window.PandoGame = { selectCountry: setNation };
  function stats() {
    return (
      '<div class="stats">' +
      Object.entries(metricNames)
        .map(
          ([key, name]) =>
            '<div><div class="stat-head"><span>' +
            name +
            '</span><b>' +
            s.stats[key] +
            '</b></div><div class="meter"><i style="width:' +
            s.stats[key] +
            '%"></i></div></div>',
        )
        .join('') +
      '</div>'
    );
  }
  function historyDetails() {
    const n = current();
    return (
      '<details class="details" id="details" ' +
      (detailOpen ? 'open' : '') +
      '><summary>경제 · 군사 · 장비</summary><dl><dt>경제</dt><dd>' +
      n.economy +
      '</dd><dt>군사</dt><dd>' +
      n.army +
      '</dd><dt>장비</dt><dd>' +
      n.equipment +
      '</dd></dl></details>'
    );
  }
  function setup() {
    const n = current();
    return (
      '<div class="panel-head"><h1>시작할 나라</h1><small>475년 겨울</small></div><div class="country-list">' +
      Object.entries(countries)
        .map(
          ([id, c]) =>
            '<button class="country ' +
            (s.country === id ? 'on' : '') +
            '" style="--tone:' +
            c.color +
            '" data-country="' +
            id +
            '" aria-pressed="' +
            (id === s.country) +
            '"><span class="country-main"><span class="sigil" aria-hidden="true">' +
            symbol[id] +
            '</span><span><strong>' +
            c.name +
            '</strong><span class="capital">' +
            c.capital +
            '</span></span></span><span class="radio-mark" aria-hidden="true"></span></button>',
        )
        .join('') +
      '</div><section class="dossier"><h2>' +
      n.name +
      '의 조정</h2><p class="body-copy">' +
      n.summary +
      '</p><p class="goal"><b>목표</b>' +
      n.goal +
      '</p>' +
      historyDetails() +
      '</section><hr class="rule"><label class="level">난이도<select id="difficulty">' +
      Object.entries(levels)
        .map(
          ([id, name]) =>
            '<option value="' +
            id +
            '" ' +
            (s.difficulty === id ? 'selected' : '') +
            '>' +
            name +
            '</option>',
        )
        .join('') +
      '</select></label>'
    );
  }
  function active() {
    const n = current(),
      e = incident(),
      last = s.orders.at(-1),
      done = s.phase === 'done';
    const [key, target] = targets[s.country],
      gained = s.stats[key] >= target;
    let body =
      '<div class="sheet-title"><div><span class="eyeline">' +
      n.capital +
      ' 조정 · ' +
      levels[s.difficulty] +
      '</span><h1>' +
      n.name +
      '의 ' +
      (done ? '기록' : '판도') +
      '</h1></div><span class="sigil" style="--tone:' +
      n.color +
      '" aria-hidden="true">' +
      symbol[s.country] +
      '</span></div>' +
      stats();
    if (s.phase === 'event') {
      body +=
        '<hr class="rule"><section id="event"><span class="event-meta">가상 사건 · ' +
        esc(e.place) +
        ' · ' +
        (s.index + 1) +
        '/3</span><h2>' +
        esc(e.title) +
        '</h2><p class="body-copy">' +
        esc(e.body) +
        '</p>';
      if (!custom) {
        e.choices.forEach((c, i) => {
          body +=
            '<button class="choice" data-choice="' +
            i +
            '"><strong>' +
            esc(c.label) +
            '</strong>' +
            (s.difficulty === 'hard'
              ? ''
              : '<small>' +
                esc(c.desc) +
                (s.difficulty === 'easy' ? ' ' + esc(deltaText(c.delta)) : '') +
                '</small>') +
            '</button>';
        });
        body +=
          '<button class="custom-toggle" id="custom">✎ 직접 결정 쓰기</button>';
      } else {
        body +=
          '<form id="order-form" class="custom-field"><label for="order">나의 결정</label><textarea id="order" maxlength="160" required placeholder="예: 창고를 열어 곡식을 나누고 장터를 연다"></textarea><label for="intent">결정의 방향</label><select id="intent"><option value="">문장에서 읽기</option>' +
          Object.entries(policy)
            .map(
              ([id, p]) => '<option value="' + id + '">' + p.name + '</option>',
            )
            .join('') +
          '</select><p id="reading" class="note" aria-live="polite">최대 두 가지 방향을 함께 반영합니다.</p><button type="submit" class="custom-confirm">결정 반영</button><button type="button" class="secondary" id="back-choices">제안된 선택 보기</button></form>';
      }
      return body + '</section>';
    }
    if (done)
      body +=
        '<hr class="rule"><span class="event-meta">150일 종료</span><h2>' +
        (gained ? '목표 달성' : '다음 계절을 기약하며') +
        '</h2><p class="body-copy">' +
        n.name +
        '의 150일 동안 ' +
        s.orders.length +
        '번의 결정을 내렸습니다.</p>';
    else
      body +=
        '<div class="time-track"><i id="day-bar" style="width:' +
        (s.day / endDay) * 100 +
        '%"></i></div><div class="sheet-title muted"><span id="day-stamp">' +
        stamp(s.day) +
        '</span><span>결정 ' +
        s.index +
        ' / 3</span></div><p id="front-note" class="front-note">' +
        esc(s.frontReport || '세 접경 거점의 판세를 관찰하는 중') +
        '</p>';
    body +=
      '<p class="goal"><b>시즌 목표</b>' +
      metricNames[key] +
      ' ' +
      target +
      ' 이상 · 현재 ' +
      s.stats[key] +
      '</p>';
    if (last)
      body +=
        '<div class="result-box"><span class="eyeline">최근 결정</span><h3>' +
        esc(last.label) +
        '</h3><p class="body-copy">' +
        esc(last.result) +
        '</p></div>';
    else
      body +=
        '<div class="result-box"><span class="eyeline">시작 기록</span><p class="body-copy">' +
        esc(n.summary) +
        '</p></div>';
    if (!done) {
      body +=
        historyDetails() +
        '<button id="reset-game" class="secondary">다른 나라로 다시 시작</button>';
    }
    return body;
  }
  function logView() {
    return (
      '<div class="panel-head"><h1>연대기</h1><small>' +
      current().name +
      '</small></div>' +
      (s.log.length
        ? '<ol class="journal">' +
          s.log
            .slice()
            .reverse()
            .map(
              (l) =>
                '<li><small>' +
                stamp(l.day) +
                '</small><strong>' +
                esc(l.title) +
                '</strong><p>' +
                esc(l.body) +
                '</p></li>',
            )
            .join('') +
          '</ol>'
        : '<p class="body-copy">시뮬레이션을 시작하면 사건과 결정이 날짜순으로 기록됩니다.</p>')
    );
  }
  function draw() {
    const n = current();
    document.body.style.setProperty('--nation', n.color);
    $('atlas-stage').classList.toggle('decision', s.phase === 'event');
    $('panel').innerHTML =
      tab === 'log' ? logView() : s.phase === 'setup' ? setup() : active();
    $('panel').scrollTop = 0;
    $('log-count').textContent = s.log.length;
    for (const [id, t] of [
      ['view-command', 'command'],
      ['view-log', 'log'],
    ]) {
      $(id).classList.toggle('chosen', tab === t);
      $(id).setAttribute('aria-pressed', String(tab === t));
    }
    speeds();
    const txt = {
      setup: n.name + '로 시작',
      running: '일시정지',
      paused: '계속 진행',
      event: '결정을 기다리는 중',
      done: '새 판 시작',
    };
    $('play').innerHTML =
      '<span class="button-icon" aria-hidden="true">' +
      { setup: '▶', running: 'Ⅱ', paused: '▶', event: 'Ⅱ', done: '↻' }[
        s.phase
      ] +
      '</span>' +
      txt[s.phase];
    $('play').disabled = s.phase === 'event';
    $('transport-label').textContent =
      s.phase === 'event' ? '사건 · 자동 정지' : '재생 속도';
    $('border-key').textContent =
      s.phase === 'setup'
        ? '475년 추정 세력권'
        : '점선 · 시작 경계 / 실선 · 가상 전선';
    $('details')?.addEventListener('toggle', (e) => {
      detailOpen = e.currentTarget.open;
    });
    $('difficulty')?.addEventListener('change', (e) => {
      s.difficulty = e.target.value;
      save();
    });
    $('custom')?.addEventListener('click', () => {
      custom = true;
      draw();
      $('order').focus();
    });
    $('back-choices')?.addEventListener('click', () => {
      custom = false;
      draw();
    });
    $('order')?.addEventListener('input', readOrder);
    $('intent')?.addEventListener('change', readOrder);
    $('order-form')?.addEventListener('submit', submitOrder);
    $('reset-game')?.addEventListener('click', askReset);
  }
  function speeds() {
    document.querySelectorAll('[data-speed]').forEach((b) => {
      const on = Number(b.dataset.speed) === s.speed;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  function pressure() {
    const p = { goguryeo: 0, baekje: 0, silla: 0 };
    for (const o of s.orders) {
      const fraction = clamp((s.day - o.day) / 10, 0, 1);
      p[s.country] += o.influence * (0.2 + 0.8 * fraction);
    }
    return p;
  }
  function paint() {
    const d = calendar(s.day);
    $('year').textContent = d.year;
    $('season').textContent = d.season;
    $('month').textContent =
      s.phase === 'setup' ? d.month + '월' : d.month + '월 ' + d.date + '일';
    if ($('day-stamp')) $('day-stamp').textContent = stamp(s.day);
    if ($('day-bar')) $('day-bar').style.width = (s.day / endDay) * 100 + '%';
    const holders = window.PandoMap.render(
      s.day,
      pressure(),
      s.country,
      s.phase === 'event' ? incident().place : null,
    );
    if (s.day > 0 && s.holders) {
      for (const [place, owner] of Object.entries(holders)) {
        const prev = s.holders[place];
        if (prev && prev !== owner) {
          s.frontReport =
            place +
            ' · ' +
            (countries[prev]?.name || '가야') +
            ' → ' +
            (countries[owner]?.name || '가야');
          journal('접경 변동', s.frontReport);
          $('log-count').textContent = s.log.length;
          if ($('front-note')) $('front-note').textContent = s.frontReport;
          if (tab === 'log') $('panel').innerHTML = logView();
        }
      }
    }
    s.holders = holders;
  }
  function launchLoop() {
    if (!raf) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }
  function tick(now) {
    raf = 0;
    if (s.phase !== 'running' || document.hidden) return;
    const elapsed = clamp((now - lastFrame) / 1000, 0, 0.3);
    lastFrame = now;
    const next = days[s.index] ?? endDay;
    s.day = Math.min(next, s.day + elapsed * s.speed * 1.5);
    if (s.day >= next) {
      if (s.index < days.length) {
        s.phase = 'event';
        custom = false;
        tab = 'command';
        journal(incident().title, '조정의 결정을 기다립니다.');
        notify('새 사건. ' + incident().title + '. 시간이 멈췄습니다.');
      } else {
        s.phase = 'done';
        journal('150일의 기록', '마지막 날의 판도가 확정되었습니다.');
        notify('시뮬레이션 종료');
      }
      draw();
      paint();
      save();
      return;
    }
    if (now - lastDraw >= 95) {
      paint();
      lastDraw = now;
    }
    raf = requestAnimationFrame(tick);
  }
  function deltaText(delta) {
    return Object.entries(delta)
      .filter(([, v]) => v)
      .map(([k, v]) => metricNames[k] + ' ' + (v > 0 ? '+' : '') + v)
      .join(' · ');
  }
  function readIntents(text) {
    return Object.entries(policy)
      .map(([id, p]) => [
        id,
        [...text.matchAll(p.words)].filter(
          (m) =>
            !/(말고|하지\s*않|하지\s*말|하지마|금지)/.test(
              text.slice(m.index + m[0].length, m.index + m[0].length + 7),
            ),
        ).length,
      ])
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map((x) => x[0]);
  }
  function readOrder() {
    const value = $('order').value.trim(),
      manual = $('intent').value;
    const ids = manual ? [manual] : readIntents(value);
    $('reading').textContent = ids.length
      ? '반영할 방향 · ' + ids.map((k) => policy[k].name).join(' + ')
      : value
        ? '이 표현은 직접 방향을 골라 주세요.'
        : '최대 두 가지 방향을 함께 반영합니다.';
    return ids;
  }
  function submitOrder(e) {
    e.preventDefault();
    const field = $('order'),
      value = field.value.trim();
    if (!value) {
      field.focus();
      return;
    }
    const ids = readOrder();
    if (!ids.length) {
      $('intent').focus();
      return;
    }
    const delta = { grain: 0, trust: 0, trade: 0 };
    let influence = 0;
    for (const id of ids) {
      const p = policy[id];
      for (const k of Object.keys(delta)) delta[k] += p.delta[k] / ids.length;
      influence += p.influence / ids.length;
    }
    for (const k of Object.keys(delta)) delta[k] = Math.round(delta[k]);
    const dirs = ids.map((id) => policy[id].name).join('·');
    decide(
      {
        label: value,
        delta,
        influence,
        result:
          '직접 내린 결정이 ' +
          dirs +
          ' 방침으로 시행됐다. ' +
          deltaText(delta) +
          '.',
      },
      true,
    );
  }
  function decide(o, typed = false) {
    if (s.phase !== 'event') return;
    for (const key of Object.keys(s.stats))
      s.stats[key] = clamp(s.stats[key] + o.delta[key], 0, 100);
    s.orders.push({
      day: s.day,
      label: o.label,
      result: o.result,
      influence: o.influence,
      typed,
    });
    journal((typed ? '친필 명령 · ' : '결정 · ') + o.label, o.result);
    s.index++;
    custom = false;
    s.phase = 'running';
    tab = 'command';
    save();
    draw();
    paint();
    notify('결정 반영. ' + s.speed + '배속으로 진행합니다.');
    launchLoop();
  }
  $('panel').addEventListener('click', (e) => {
    const country = e.target.closest('[data-country]'),
      choice = e.target.closest('[data-choice]');
    if (country) setNation(country.dataset.country);
    if (choice && s.phase === 'event') {
      const c = incident().choices[Number(choice.dataset.choice)];
      if (c) decide(c);
    }
  });
  for (const [id, t] of [
    ['view-command', 'command'],
    ['view-log', 'log'],
  ])
    $(id).onclick = () => {
      tab = t;
      custom = false;
      draw();
    };
  document.querySelectorAll('[data-speed]').forEach(
    (b) =>
      (b.onclick = () => {
        s.speed = Number(b.dataset.speed);
        speeds();
        save();
        notify(s.speed + '배속');
      }),
  );
  $('play').onclick = () => {
    if (s.phase === 'done') {
      s = fresh(s.country, s.speed, s.difficulty);
      tab = 'command';
      detailOpen = false;
    } else if (s.phase === 'setup') {
      s.phase = 'running';
      journal(current().name + '의 첫겨울', current().summary);
    } else if (s.phase === 'running') s.phase = 'paused';
    else if (s.phase === 'paused') s.phase = 'running';
    else return;
    save();
    draw();
    paint();
    if (s.phase === 'running') launchLoop();
  };
  function openDialog(title, content) {
    const d = $('record-dialog');
    d.querySelector('h2').textContent = title;
    $('credits').innerHTML = content;
    d.showModal();
  }
  function pauseForDialog() {
    const wasRunning = s.phase === 'running';
    if (wasRunning) {
      s.phase = 'paused';
      draw();
      save();
    }
    modalAction = wasRunning
      ? () => {
          if (s.phase === 'paused') {
            s.phase = 'running';
            draw();
            save();
            launchLoop();
          }
        }
      : null;
  }
  function askReset() {
    pauseForDialog();
    openDialog(
      '새 판을 시작할까요?',
      '<p>이 판에서 내린 결정 ' +
        s.orders.length +
        '개와 현재 전황이 새 판으로 교체됩니다.</p><button class="primary" id="confirm-reset">새 판으로</button><button class="secondary" id="stay">현재 판으로 돌아가기</button>',
    );
    $('stay').onclick = () => $('record-dialog').close();
    $('confirm-reset').onclick = () => {
      modalAction = null;
      $('record-dialog').close();
      s = fresh(s.country, s.speed, s.difficulty);
      tab = 'command';
      custom = false;
      detailOpen = false;
      save();
      draw();
      paint();
    };
  }
  $('sources').onclick = () => {
    pauseForDialog();
    openDialog(
      '지도와 사료',
      '<p><b>실제 지형</b> · 해안선과 강은 Natural Earth 1:10m, 지형 음영은 실제 고도 자료에 기반합니다. 오늘날의 해안선을 바탕으로 한반도 중남부와 그 주변을 표시합니다.</p><p><b>475년 겨울</b> · 한성 함락 이후의 판세를 근사했습니다. 경계와 문양은 재구성이며 가야 표시는 여러 가야 세력을 묶은 것입니다. 시뮬레이션의 날짜·전선·자원·사건은 게임 규칙에 따른 가상 역사입니다.</p><p><b>직접 결정</b> · 문장의 단서로 최대 두 정책을 판독하는 로컬 규칙을 사용합니다. 방향이 다르면 직접 지정할 수 있습니다.</p><ul class="credit-list">' +
        [
          ...sources,
          {
            label: '5세기 삼국 판도 · 국사편찬위원회',
            url: 'https://contents.history.go.kr/front/ta/print.do?levelId=ta_h71_0040_0010_0030_0020',
          },
          {
            label: '해안선·하천 · Natural Earth',
            url: 'https://www.naturalearthdata.com/',
          },
          {
            label: '표고 · Mapzen Terrain Tiles (SRTM·GMTED2010·ETOPO1)',
            url: 'https://registry.opendata.aws/terrain-tiles/',
          },
        ]
          .map(
            (v) =>
              '<li><a href="' +
              esc(v.url) +
              '" target="_blank" rel="noopener">' +
              esc(v.label) +
              '</a></li>',
          )
          .join('') +
        '</ul>',
    );
  };
  $('close-dialog').onclick = () => $('record-dialog').close();
  $('record-dialog').addEventListener('close', () => {
    const fn = modalAction;
    modalAction = null;
    if (fn) fn();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else if (s.phase === 'running') launchLoop();
  });
  window.addEventListener('pagehide', save);
  draw();
  paint();
})();
