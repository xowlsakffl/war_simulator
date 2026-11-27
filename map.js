(() => {
  'use strict';
  const atlas = window.ATLAS_BASE;
  const countries = window.PANDO_DATA.countries;
  const svg = document.getElementById('atlas-map');
  const stage = document.getElementById('atlas-stage');
  const byId = (id) => document.getElementById(id);
  const radians = Math.PI / 180;
  const northMercator = Math.asinh(Math.tan(41.15 * radians));
  const xy = ([lng, lat]) => [
    ((lng - 122.6) * 1000) / 8.8,
    ((northMercator - Math.asinh(Math.tan(lat * radians))) * 1000) /
      (8.8 * radians),
  ];
  const f = (n) => n.toFixed(2);
  const point = (p) => p.map(f).join(',');
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  byId('shore-clip').setAttribute('d', atlas.landPath);
  const colors = {
    goguryeo: '#aa4434',
    baekje: '#3c6083',
    silla: '#c69842',
    gaya: '#849268',
  };
  const names = {
    goguryeo: '고구려',
    baekje: '백제',
    silla: '신라',
    gaya: '가야',
  };
  const towns = {
    평양: [125.754, 39.028],
    한성: [127.118, 37.539],
    웅진: [127.128, 36.463],
    금성: [129.22, 35.837],
    중원: [127.91, 37.0],
    낙동강: [128.38, 35.83],
    한강: [127.25, 37.5],
  };
  // These chains describe the scenario's approximate spheres of influence. The land mask and relief use measured geography.
  const chains = {
    west: [
      [125.77, 37.04],
      [126.32, 37.09],
      [126.71, 37.13],
      [126.85, 37.04],
      [127.05, 37.08],
      [127.19, 37.02],
      [127.43, 37.1],
      [127.65, 36.94],
      [127.88, 37.0],
      [128.08, 36.91],
    ],
    east: [
      [128.08, 36.91],
      [128.32, 36.89],
      [128.53, 36.92],
      [128.62, 37.1],
      [128.81, 37.2],
      [129.02, 37.16],
      [129.15, 37.29],
      [129.5, 37.34],
      [129.9, 37.37],
    ],
    spine: [
      [128.08, 36.91],
      [127.98, 36.72],
      [127.85, 36.64],
      [127.91, 36.47],
      [127.78, 36.37],
      [127.86, 36.21],
      [127.71, 36.05],
      [127.78, 35.91],
      [127.68, 35.8],
    ],
    southwest: [
      [127.68, 35.8],
      [127.61, 35.58],
      [127.65, 35.39],
      [127.55, 35.25],
      [127.54, 35.07],
      [127.62, 34.97],
      [127.6, 34.73],
      [127.7, 34.43],
      [127.75, 34.13],
    ],
    southeast: [
      [127.68, 35.8],
      [127.92, 35.87],
      [128.1, 35.89],
      [128.24, 35.87],
      [128.3, 35.74],
      [128.43, 35.68],
      [128.43, 35.48],
      [128.57, 35.4],
      [128.66, 35.23],
      [128.83, 35.2],
      [128.97, 35.05],
      [129.02, 34.77],
      [129.04, 34.3],
    ],
  };
  const restGog = [
    [132.0, 39.0],
    [132.5, 42.4],
    [123.9, 42.3],
    [122.35, 39.83],
    [121.22, 38.9],
    [121.45, 38.65],
    [123.12, 38.85],
    [124.05, 38.5],
    [124.35, 37.09],
  ];
  const westSea = [
    [127.35, 33.97],
    [126.0, 33.95],
    [125.01, 35.0],
    [125.25, 36.45],
  ];
  const eastSea = [
    [128.89, 34.65],
    [129.28, 34.94],
    [129.83, 35.1],
  ];
  function chain(name, day, pressure) {
    const line = chains[name];
    return line.map(([x, y], i) => {
      const t = i / (line.length - 1),
        envelope = Math.sin(Math.PI * t);
      const phase = {
        west: 0.2,
        east: 1.8,
        spine: 2.7,
        southwest: 3.8,
        southeast: 4.6,
      }[name];
      const motion =
        (Math.sin(day / 13 + phase) - Math.sin(phase)) * 0.088 +
        (Math.sin(day / 6 + t * 4) - Math.sin(t * 4)) * 0.041;
      let power = (pressure.goguryeo - pressure.baekje) * 0.043;
      if (name === 'east') power = (pressure.goguryeo - pressure.silla) * 0.048;
      if (name === 'spine') power = (pressure.baekje - pressure.silla) * 0.047;
      if (name === 'southwest') power = pressure.baekje * 0.034;
      if (name === 'southeast') power = -pressure.silla * 0.035;
      const amp = envelope * (motion + power);
      return xy(
        name === 'west' || name === 'east'
          ? [x + 0.1 * amp, y - amp]
          : [x + amp, y + 0.16 * amp],
      );
    });
  }
  const coords = (arr) => arr.map(xy);
  const lineD = (points) => 'M' + points.map(point).join('L');
  const reverse = (arr) => arr.slice().reverse();
  const zero = { goguryeo: 0, baekje: 0, silla: 0 };
  function soften(points) {
    const result = [points[0]];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1],
        before = points[Math.max(0, i - 1)],
        after = points[Math.min(points.length - 1, i + 2)];
      for (let j = 1; j <= 6; j++) {
        const t = j / 6,
          t2 = t * t,
          t3 = t2 * t;
        const p = a.map(
          (v, k) =>
            (2 * v +
              (-before[k] + b[k]) * t +
              (2 * before[k] - 5 * v + 4 * b[k] - after[k]) * t2 +
              (-before[k] + 3 * v - 3 * b[k] + after[k]) * t3) /
            2,
        );
        if (j < 6)
          p[1] += 0.95 * Math.sin(t * Math.PI) * Math.sin(i * 7.3 + j * 1.9);
        result.push(p);
      }
    }
    return result;
  }
  function geometry(day, pressure) {
    const c = {},
      raw = {};
    for (const key of Object.keys(chains)) {
      raw[key] = chain(key, day, pressure);
      c[key] = soften(raw[key]);
    }
    const shapes = {
      goguryeo: [...c.west, ...c.east.slice(1), ...coords(restGog)],
      baekje: [
        ...c.west,
        ...c.spine.slice(1),
        ...c.southwest.slice(1),
        ...coords(westSea),
      ],
      silla: [
        ...c.east,
        ...reverse(coords(eastSea)),
        ...reverse(c.southeast),
        ...reverse(c.spine),
      ],
      gaya: [
        ...c.southeast,
        ...coords([
          [128.7, 34.3],
          [128.15, 34.1],
          [127.75, 34.13],
        ]),
        ...reverse(c.southwest),
      ],
    };
    return { c, raw, shapes };
  }
  const initial = geometry(0, zero);
  // Keep the southern sea lane and Tsushima outside all peninsula factions.
  const southernSea =
    'M' +
    [
      [128.88, 34.7],
      [129.35, 34.96],
      [130.4, 34.95],
      [130.4, 33.7],
      [128.88, 33.7],
    ]
      .map(xy)
      .map(point)
      .join('L') +
    'Z';
  const defs = svg.querySelector('defs');
  defs.insertAdjacentHTML(
    'beforeend',
    '<mask id="peninsula-domain" maskUnits="userSpaceOnUse" x="-450" y="0" width="1900" height="1075"><rect x="-450" y="0" width="1900" height="1075" fill="white"/><path fill="black" d="' +
      southernSea +
      '"/></mask>',
  );
  byId('geo').setAttribute('mask', 'url(#peninsula-domain)');
  byId('zones').innerHTML = Object.keys(colors)
    .map(
      (id) =>
        '<path id="zone-' +
        id +
        '" data-nation="' +
        id +
        '" fill="' +
        colors[id] +
        '" d="' +
        lineD(initial.shapes[id]) +
        'Z"/>',
    )
    .join('');
  byId('zones').style.mixBlendMode = 'multiply';
  byId('zones').setAttribute('opacity', '.77');
  byId('front-history').innerHTML = Object.values(initial.c)
    .map(
      (a) =>
        '<path d="' +
        lineD(a) +
        '" fill="none" stroke="#58452c" stroke-width="1.6" stroke-dasharray="4 4"/>',
    )
    .join('');
  byId('fronts').innerHTML = Object.keys(chains)
    .map(
      (k) =>
        '<g><path id="edge-base-' +
        k +
        '" fill="none" stroke="#514331" stroke-width="3.6" stroke-linejoin="round"/><path id="edge-' +
        k +
        '" fill="none" stroke="#f7e8c4" stroke-width="2" stroke-linejoin="round"/></g>',
    )
    .join('');
  const labels = {
    goguryeo: [126.94, 38.72],
    baekje: [126.91, 35.79],
    silla: [128.94, 36.27],
    gaya: [128.14, 35.24],
  };
  const stateLabels = Object.entries(labels)
    .map(([id, p]) => {
      const [x, y] = xy(p),
        name = names[id];
      return (
        '<text x="' +
        x +
        '" y="' +
        y +
        '" class="nation-label ' +
        id +
        '" font-size="' +
        (id === 'goguryeo' ? 43 : id === 'gaya' ? 23 : 37) +
        '" data-nation="' +
        id +
        '">' +
        name +
        '</text>'
      );
    })
    .join('');
  const placeLabels = Object.entries(towns)
    .slice(0, 4)
    .map(([name, p]) => {
      const [x, y] = xy(p);
      return (
        '<g data-city="' +
        name +
        '"><circle class="city-dot" cx="' +
        x +
        '" cy="' +
        y +
        '" r="4.3"/><text class="city-name" x="' +
        (x + 8) +
        '" y="' +
        (y + 4) +
        '">' +
        name +
        '</text></g>'
      );
    })
    .join('');
  byId('labels').innerHTML = stateLabels + placeLabels;
  const seaName = (p, name) => {
    const [x, y] = xy(p);
    return (
      '<text class="water-name" x="' + x + '" y="' + y + '">' + name + '</text>'
    );
  };
  byId('cartography').innerHTML =
    '<path d="' +
    atlas.riverPath +
    '" fill="none" stroke="#a6c7b8" stroke-width=".7" opacity=".74" pointer-events="none"/>' +
    seaName([124.92, 36.08], '황 해') +
    seaName([130.73, 38.16], '동 해') +
    '<g id="stations"></g>';
  const standard = (p, n, flip = 1) => {
    const [x, y] = p;
    return (
      '<g transform="translate(' +
      f(x) +
      ' ' +
      f(y) +
      ') scale(' +
      flip +
      ' 1)" filter="url(#flagShadow)"><ellipse cx="0" cy="1" rx="7" ry="2" fill="#463c2c" opacity=".35"/><path d="M0 0V-22" stroke="#433222" stroke-width="1.5"/><path d="M1-21 Q9-24 17-20 L16-10 Q8-14 1-10Z" fill="' +
      colors[n] +
      '" stroke="#fcf0cd" stroke-width="1"/><path d="m6-16 3-3 3 3-3 3Z" stroke="#fff2cc" fill="none" stroke-width="1.1"/></g>'
    );
  };
  let zoom = 1,
    pan = [0, 0],
    box = { x: 0, y: 0, w: 800, h: 900 },
    selected = 'baekje';
  function layout() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = rect.width / rect.height,
      h = Math.min(1040, 1870 / ratio, Math.max(856, 650 / ratio)) / zoom,
      w = h * ratio;
    const x = clamp(531 - w / 2 + pan[0], -450, 1450 - w),
      y = clamp(621 - h / 2 + pan[1], 0, atlas.height - h);
    box = { x, y, w, h };
    svg.setAttribute('viewBox', [x, y, w, h].map(f).join(' '));
    byId('zoom-out').disabled = zoom <= 1;
    byId('zoom-in').disabled = zoom >= 2.35;
  }
  function stepZoom(delta) {
    zoom = clamp(+(zoom + delta).toFixed(2), 1, 2.35);
    layout();
  }
  byId('zoom-in').onclick = () => stepZoom(0.35);
  byId('zoom-out').onclick = () => stepZoom(-0.35);
  byId('zoom-home').onclick = () => {
    zoom = 1;
    pan = [0, 0];
    layout();
  };
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = {
      x: e.clientX,
      y: e.clientY,
      p: pan.slice(),
      n: e.target.closest('[data-nation]')?.dataset.nation,
      moved: false,
    };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    if (drag.moved) {
      const scale = box.w / stage.clientWidth;
      pan = [drag.p[0] - dx * scale, drag.p[1] - dy * scale];
      layout();
    }
  });
  svg.addEventListener('pointerup', () => {
    if (drag && !drag.moved && countries[drag.n])
      window.PandoGame?.selectCountry(drag.n);
    drag = null;
  });
  svg.addEventListener('pointercancel', () => {
    drag = null;
  });
  new ResizeObserver(layout).observe(stage);
  const observations = [
    ['서부 접경', [127.05, 37.045]],
    ['동부 접경', [128.63, 37.11]],
    ['산간 접경', [127.845, 36.431]],
  ];
  function inside(p, ring) {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i],
        b = ring[j];
      if (
        a[1] > p[1] !== b[1] > p[1] &&
        p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
      )
        hit = !hit;
    }
    return hit;
  }
  function render(day, pressure, nation, eventPlace) {
    const { c, raw, shapes } = geometry(day, pressure);
    for (const [id, shape] of Object.entries(shapes))
      byId('zone-' + id).setAttribute('d', lineD(shape) + 'Z');
    for (const [id, path] of Object.entries(c)) {
      const d = lineD(path);
      byId('edge-' + id).setAttribute('d', d);
      byId('edge-base-' + id).setAttribute('d', d);
    }
    const flags = [
      ['west', 3, 'goguryeo', -8],
      ['west', 5, 'baekje', 13],
      ['west', 7, 'goguryeo', -8],
      ['east', 4, 'goguryeo', -8],
      ['east', 5, 'silla', 14],
      ['spine', 3, 'baekje', 1],
      ['spine', 6, 'silla', 4],
    ];
    byId('standards').innerHTML = flags
      .map(([k, i, n, oy], j) => {
        const [x, y] = raw[k][i];
        return standard(
          [x + (k === 'spine' ? (j % 2 ? -10 : 9) : 0), y + oy],
          n,
          j % 2 ? 1 : -1,
        );
      })
      .join('');
    const capital = countries[nation]?.capital || '웅진';
    const pos = xy(towns[eventPlace] || towns[capital]);
    byId('event-pin').innerHTML =
      '<circle class="event-halo" cx="' +
      pos[0] +
      '" cy="' +
      pos[1] +
      '" r="' +
      (eventPlace ? 15 : 10) +
      '" pointer-events="none"/>';
    selected = nation;
    const holders = {};
    byId('stations').innerHTML = observations
      .map(([name, location]) => {
        const p = xy(location);
        const owner = Object.keys(shapes).find((id) => inside(p, shapes[id]));
        if (!owner) return '';
        holders[name] = owner;
        return day > 0
          ? '<g transform="translate(' +
              p.join(' ') +
              ')" pointer-events="none"><path d="M0 -4.3 4.3 0 0 4.3 -4.3 0Z" stroke="#f7eaca" stroke-width="1.3" fill="' +
              colors[owner] +
              '"/></g>'
          : '';
      })
      .join('');
    return holders;
  }
  window.PandoMap = { render, layout };
  layout();
  render(0, zero, selected, null);
})();
