(function () {
  'use strict';
  var G = window.Gunghap;
  var D = window.APP_DATA;
  var CELEBS = (window.CELEBS || []).slice();
  var app = document.getElementById('app');

  /* ---------- 저장 (이 기기에만) ---------- */
  var KEY_ME = 'gh.me.v1';
  var KEY_BOOK = 'gh.book.v1';
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 저장 불가 환경: 무시 */ }
  }

  /* ---------- 상태 ---------- */
  var state = {
    me: null,               // G.profile 결과
    view: 'onboard',
    stack: [],
    tab: 'fill',
    cat: 'all',
    gender: 'all',
    query: '',
    result: null,
    book: load(KEY_BOOK, {}) // { "<카드no>": "처음 만난 사람 이름" }
  };
  var savedMe = load(KEY_ME, null);
  if (savedMe && typeof savedMe === 'string') {
    var pm = G.parseYmd(savedMe);
    if (G.isValidDate(pm.y, pm.m, pm.d)) state.me = G.profile(savedMe);
  }

  /* ---------- 유틸 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayYmd() {
    var t = new Date();
    return G.ymd(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }
  function dotDate(p) { return p.y + '.' + (p.m < 10 ? '0' : '') + p.m + '.' + (p.d < 10 ? '0' : '') + p.d; }
  function stemOf(i) { return D.stems[i]; }
  function elemOf(i) { return D.elements[D.stems[i].element]; }
  function stemLabel(i) { return stemOf(i).stem + elemOf(i).ko; } // 예: 丙화
  function cardFor(meIdx, otherIdx) { return D.cards[meIdx * 10 + otherIdx]; }
  function astroKey(e1, e2) { return [e1, e2].sort().join('-'); }
  function bookCount() {
    if (!state.me) return 0;
    var n = 0;
    for (var j = 0; j < 10; j++) if (state.book[cardFor(state.me.stemIndex, j).no]) n++;
    return n;
  }
  var CAT_KO = { idol: '아이돌', actor: '배우', sports: '스포츠', creator: '크리에이터' };

  function match(person) {
    var p = G.profile(person.birth);
    var card = cardFor(state.me.stemIndex, p.stemIndex);
    return {
      person: person,
      prof: p,
      card: card,
      score: G.score(card.baseScore, state.me.sign.element, p.sign.element)
    };
  }

  /* ---------- 아이콘 ---------- */
  var IC = {
    logo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D8B46A" stroke-width="1.6" aria-hidden="true"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    search: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
    book: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="4" y="4" width="7" height="10" rx="3.5"/><rect x="13" y="10" width="7" height="10" rx="3.5"/></svg>',
    lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A49CB8" stroke-width="1.6" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    save: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 4v11M7 9l5-5 5 5M5 15v4h14v-4"/></svg>',
    star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8B46A" stroke-width="1.6" aria-hidden="true"><path d="M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z"/></svg>'
  };

  /* ---------- 카드 문양 (오행 5개 × 연결선 6종) ---------- */
  var GLYPH = {
    wood: '<path d="M0 -20 V20"/><path d="M0 -4 C-14 -8 -20 -18 -18 -21 C-8 -23 0 -15 0 -4 Z"/><path d="M0 9 C14 5 20 -5 18 -8 C8 -10 0 -3 0 9 Z"/>',
    fire: '<path d="M0 -22 C10 -10 16 -2 12 10 C8 19 -8 19 -12 10 C-16 -2 -8 -10 0 -22 Z"/><path d="M0 -6 C5 2 6 8 0 15"/>',
    earth: '<path d="M-22 16 L-8 -8 L0 4 L8 -16 L22 16 Z"/><path d="M-27 16 H27"/>',
    metal: '<path d="M-15 -6 L-6 -17 H6 L15 -6 L0 19 Z"/><path d="M-15 -6 H15 M-6 -17 L-3 -6 L0 19 M6 -17 L3 -6 L0 19"/>',
    water: '<path d="M0 -21 C8 -9 14 -1 14 7 C14 15 7 20 0 20 C-7 20 -14 15 -14 7 C-14 -1 -8 -9 0 -21 Z"/><path d="M-7 8 C-4 12 4 12 7 8"/>'
  };
  var CONNECTOR = {
    knot: '<circle cx="94" cy="92" r="7"/><circle cx="106" cy="92" r="7"/>',
    mirror: '<path d="M80 92 H120"/><path d="M100 87 L104 92 L100 97 L96 92 Z" fill="#D8B46A"/>',
    parallel: '<path d="M94 81 V103 M106 81 V103"/>',
    'flow-up': '<path d="M100 105 V80 M93 87 L100 80 L107 87"/>',
    'flow-down': '<path d="M100 80 V105 M93 98 L100 105 L107 98"/>',
    cross: '<path d="M91 83 L109 101 M109 83 L91 101"/>'
  };
  function emblemSVG(card, label) {
    var top = D.elements[card.top].color, bot = D.elements[card.bottom].color;
    var a11y = label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"';
    return '<svg class="emblem" viewBox="0 0 200 200" ' + a11y + ' xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="100" cy="100" r="86" fill="none" stroke="#3A3058"/>' +
      '<circle cx="100" cy="100" r="70" fill="none" stroke="#3A3058" stroke-dasharray="2 5"/>' +
      '<path d="M30 166 L64 152 L100 164 L136 148 L170 164" fill="none" stroke="#6F6390"/>' +
      '<circle cx="30" cy="166" r="1.8" fill="#EFE6D2"/><circle cx="100" cy="164" r="1.8" fill="#EFE6D2"/><circle cx="170" cy="164" r="1.8" fill="#EFE6D2"/>' +
      '<circle cx="64" cy="152" r="4" fill="' + top + '"/><circle cx="136" cy="148" r="4" fill="' + bot + '"/>' +
      '<path d="M100 6 L103 14 L100 22 L97 14 Z" fill="#D8B46A"/><path d="M100 178 L103 186 L100 194 L97 186 Z" fill="#D8B46A"/>' +
      '<g transform="translate(100 56)" fill="none" stroke="' + top + '" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">' + GLYPH[card.top] + '</g>' +
      '<g fill="none" stroke="#D8B46A" stroke-width="1.5" stroke-linecap="round">' + CONNECTOR[card.connector] + '</g>' +
      '<g transform="translate(100 126)" fill="none" stroke="' + bot + '" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">' + GLYPH[card.bottom] + '</g>' +
      '</svg>';
  }
  function stemDot(i, lg) {
    var c = elemOf(i).color;
    return '<span class="stem-dot' + (lg ? ' lg' : '') + '" style="border-color:' + c + ';color:' + c + '" aria-hidden="true">' + stemOf(i).stem + '</span>';
  }

  /* ---------- 내비게이션 ---------- */
  function go(view, push) {
    if (push !== false) {
      state.stack.push(state.view);
      try { history.pushState({ v: view }, ''); } catch (e) {}
    }
    state.view = view;
    render();
    window.scrollTo(0, 0);
  }
  function back() {
    var prev = state.stack.pop();
    state.view = prev || (state.me ? 'recs' : 'onboard');
    render();
    window.scrollTo(0, 0);
  }
  window.addEventListener('popstate', function () {
    if (state.stack.length) back();
  });

  /* ---------- 날짜 선택 ---------- */
  function dateSelects(prefix, val) {
    var thisYear = new Date().getFullYear();
    var y = '<option value="">년</option>';
    for (var i = thisYear; i >= 1930; i--) y += '<option value="' + i + '"' + (val && val.y === i ? ' selected' : '') + '>' + i + '년</option>';
    var m = '<option value="">월</option>';
    for (i = 1; i <= 12; i++) m += '<option value="' + i + '"' + (val && val.m === i ? ' selected' : '') + '>' + i + '월</option>';
    var d = '<option value="">일</option>';
    for (i = 1; i <= 31; i++) d += '<option value="' + i + '"' + (val && val.d === i ? ' selected' : '') + '>' + i + '일</option>';
    return '<div class="date-row">' +
      '<label class="sr" for="' + prefix + '-y" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">년</label><select class="select" id="' + prefix + '-y">' + y + '</select>' +
      '<label class="sr" for="' + prefix + '-m" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">월</label><select class="select" id="' + prefix + '-m">' + m + '</select>' +
      '<label class="sr" for="' + prefix + '-d" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">일</label><select class="select" id="' + prefix + '-d">' + d + '</select>' +
      '</div>';
  }
  function readDate(prefix) {
    var y = +document.getElementById(prefix + '-y').value;
    var m = +document.getElementById(prefix + '-m').value;
    var d = +document.getElementById(prefix + '-d').value;
    if (!y || !m || !d) return { error: '년, 월, 일을 모두 골라주세요.' };
    if (!G.isValidDate(y, m, d)) return { error: y + '년 ' + m + '월에는 ' + d + '일이 없어요. 날짜를 다시 확인해주세요.' };
    return { y: y, m: m, d: d };
  }
  var LUNAR_NOTE = '음력 생일은 <a href="https://astro.kasi.re.kr/life/pageView/8" target="_blank" rel="noopener">한국천문연구원 음양력 변환</a>에서 양력으로 바꿔 입력해주세요.';

  /* ---------- 화면: 생일 입력 ---------- */
  function vOnboard() {
    var sample = cardFor(2, 0);
    var editing = !!state.me;
    return '<section class="view">' +
      '<div class="bar">' +
        (editing ? '<button type="button" class="icon-btn" data-act="back" aria-label="뒤로">' + IC.back + '</button>' : '<div class="brand">' + IC.logo + '<span>최애 궁합</span></div>') +
        '<span></span></div>' +
      '<div style="display:flex;align-items:center;gap:16px">' +
        '<div style="width:86px;flex:none;border:1px solid var(--gold);border-radius:43px 43px 8px 8px;padding:12px 6px 8px;background:var(--panel)">' + emblemSVG(sample) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;min-width:0">' +
          '<h1 class="h1">나와 최애,<br>어떤 카드가 뽑힐까</h1>' +
        '</div>' +
      '</div>' +
      '<p class="lede">내 생일을 넣으면 사주·별자리·타로로 나와 잘 맞는 셀럽을 찾아주고, 둘만의 관계 카드를 뽑아줘요.</p>' +
      '<form id="f-me" class="view" style="gap:18px" novalidate>' +
        '<div class="field"><span class="label">내 생년월일 (양력)</span>' + dateSelects('me', state.me) +
          '<p class="small" style="margin:0">' + LUNAR_NOTE + '</p>' +
          '<p class="error" id="me-err" role="alert"></p></div>' +
        '<div class="note">' + IC.lock + '<span>생일은 이 기기에만 저장돼요. 서버로 보내지 않아요.</span></div>' +
        '<button type="submit" class="btn">' + (editing ? '이 생일로 다시 보기' : '나랑 맞는 셀럽 보기') + '</button>' +
      '</form>' +
    '</section>';
  }

  /* ---------- 화면: 추천 ---------- */
  var TABS = [
    { key: 'fill', label: '채워주는', desc: '천간합이거나, 서로의 기운을 키워주는 사람' },
    { key: 'same', label: '닮은꼴', desc: '타고난 기운이 나와 같은 사람' },
    { key: 'odd', label: '의외의 케미', desc: '부딪히는 기운이라 오히려 서로를 단련시키는 사람' }
  ];
  function filtered() {
    return CELEBS.filter(function (c) {
      return (state.cat === 'all' || (c.cats || [c.category]).indexOf(state.cat) >= 0) && (state.gender === 'all' || c.gender === state.gender);
    }).map(match);
  }
  function rowHTML(r, rank) {
    var sub = [r.person.group, r.card.relationLabel].filter(Boolean).join(' · ');
    return '<li><button type="button" class="row" data-act="open" data-id="' + esc(r.person.id) + '">' +
      (rank ? '<span class="rank">' + rank + '</span>' : '') +
      stemDot(r.prof.stemIndex) +
      '<span class="row-main"><span class="row-name">' + esc(r.person.name) + '</span><span class="row-sub">' + esc(sub) + '</span></span>' +
      '<span class="row-score">' + r.score + '</span></button></li>';
  }
  function vRecs() {
    var me = state.me;
    var all = CELEBS.map(match).sort(function (a, b) { return b.score - a.score || (b.person.pop || 0) - (a.person.pop || 0); });
    var todayPick = null;
    if (all.length) {
      var top = all.slice(0, Math.min(5, all.length));
      todayPick = top[G.hash(todayYmd() + me.ymd) % top.length];
    }
    var tab = TABS.filter(function (t) { return t.key === state.tab; })[0];
    var items = filtered().filter(function (r) { return r.card.tab === state.tab; })
      .sort(function (a, b) { return b.score - a.score || (b.person.pop || 0) - (a.person.pop || 0) || a.person.name.localeCompare(b.person.name); }).slice(0, 10);
    var present = {};
    CELEBS.forEach(function (c) { (c.cats || [c.category]).forEach(function (k) { present[k] = true; }); });
    var cats = [['all', '전체 분야']].concat([['idol', '아이돌·가수'], ['actor', '배우'], ['sports', '스포츠'], ['creator', '크리에이터']]
      .filter(function (c) { return present[c[0]]; }));
    var gens = [['all', '전체'], ['m', '남성'], ['f', '여성']];
    var t = todayYmd().split('-');
    return '<section class="view">' +
      '<div class="bar"><div class="brand">' + IC.logo + '<span>최애 궁합</span></div>' +
        '<div class="bar-actions">' +
          '<button type="button" class="icon-btn" data-act="book" aria-label="내 카드 도감">' + IC.book + '</button>' +
          '<button type="button" class="icon-btn" data-act="search" aria-label="이름으로 찾기">' + IC.search + '</button>' +
        '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap" class="small">' +
          '<span>' + dotDate(me) + ' · ' + stemLabel(me.stemIndex) + ' · ' + me.sign.ko + '</span>' +
          '<button type="button" class="link-btn" style="min-height:32px;font-size:13px" data-act="edit-me">생일 바꾸기</button></div>' +
        '<h1 class="h1">나랑 찰떡인 셀럽</h1></div>' +
      (todayPick ?
        '<button type="button" class="today" data-act="open" data-id="' + esc(todayPick.person.id) + '">' +
          '<span class="today-top"><span class="today-tag">오늘의 케미</span><span class="small">' + (+t[1]) + '월 ' + (+t[2]) + '일</span></span>' +
          '<span class="today-body">' + stemDot(todayPick.prof.stemIndex, true) +
            '<span style="display:flex;flex-direction:column;gap:3px;min-width:0"><span style="font-size:18px;font-weight:600">' + esc(todayPick.person.name) + '</span>' +
            '<span class="small" style="color:var(--soft)">오늘 둘의 카드는 「' + esc(todayPick.card.name) + '」. 눌러서 펼쳐보세요.</span></span></span>' +
        '</button>' : '') +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div class="tabs" role="tablist" aria-label="추천 유형">' + TABS.map(function (x) {
          return '<button type="button" role="tab" class="tab" data-act="tab" data-v="' + x.key + '" aria-selected="' + (x.key === state.tab) + '">' + x.label + '</button>';
        }).join('') + '</div>' +
        '<p class="small" style="margin:0">' + tab.desc + '</p></div>' +
      '<div class="chips" role="group" aria-label="분야">' + cats.map(function (c) {
        return '<button type="button" class="chip" data-act="cat" data-v="' + c[0] + '" aria-pressed="' + (state.cat === c[0]) + '">' + c[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="chips" role="group" aria-label="성별" style="margin-top:-12px">' + gens.map(function (g) {
        return '<button type="button" class="chip" data-act="gender" data-v="' + g[0] + '" aria-pressed="' + (state.gender === g[0]) + '">' + g[1] + '</button>';
      }).join('') + '</div>' +
      (items.length ? '<ol class="list">' + items.map(function (r, i) { return rowHTML(r, i + 1); }).join('') + '</ol>'
        : '<div class="empty">이 조건에 맞는 셀럽이 아직 없어요.<br>다른 탭이나 분야를 골라보세요.</div>') +
      '<button type="button" class="btn-ghost" data-act="search">' + IC.search + '이름으로 찾거나 직접 입력하기</button>' +
      '<p class="fine">연·월·일 기준으로 계산해요. 재미로 봐주세요.</p>' +
    '</section>';
  }

  /* ---------- 화면: 검색 · 직접 입력 ---------- */
  function vSearch() {
    return '<section class="view">' +
      '<div class="bar"><button type="button" class="icon-btn" data-act="back" aria-label="뒤로">' + IC.back + '</button><span></span></div>' +
      '<h1 class="h1">누구랑 볼까요?</h1>' +
      '<div class="field"><label class="label" for="q">이름으로 찾기</label>' +
        '<input class="input" id="q" type="search" autocomplete="off" placeholder="아티스트, 배우, 선수 이름" value="' + esc(state.query) + '"></div>' +
      '<ul class="list" id="q-results"></ul>' +
      '<form id="f-custom" class="view" style="gap:16px;border-top:1px solid var(--line);padding-top:22px" novalidate>' +
        '<div style="display:flex;flex-direction:column;gap:4px"><h2 class="display" style="font-size:19px">목록에 없나요?</h2>' +
        '<p class="small" style="margin:0">생일만 알면 누구와도 볼 수 있어요. 입력한 내용은 저장하지 않아요.</p></div>' +
        '<div class="field"><label class="label" for="c-name">이름</label><input class="input" id="c-name" maxlength="20" placeholder="예: 우리 최애" autocomplete="off"></div>' +
        '<div class="field"><span class="label">생년월일 (양력)</span>' + dateSelects('c', null) + '<p class="error" id="c-err" role="alert"></p></div>' +
        '<button type="submit" class="btn">카드 뽑기</button>' +
      '</form>' +
    '</section>';
  }
  function renderSearchResults() {
    var box = document.getElementById('q-results');
    if (!box) return;
    var q = state.query.trim().toLowerCase().replace(/\s+/g, '');
    var byPop = function (a, b) { return (b.pop || 0) - (a.pop || 0) || a.name.localeCompare(b.name); };
    var found = CELEBS.filter(function (c) {
      return !q || c.name.toLowerCase().replace(/\s+/g, '').indexOf(q) >= 0 || (c.group || '').toLowerCase().replace(/\s+/g, '').indexOf(q) >= 0;
    }).sort(byPop);
    var limit = q ? 50 : 20;
    var head = q ? '' : '<li class="small" style="padding:4px 2px">많이 찾는 사람</li>';
    var more = found.length > limit ? '<li class="small" style="padding:12px 2px;text-align:center">' + (found.length - limit) + '명 더 있어요. 이름을 더 정확히 입력해보세요.</li>' : '';
    box.innerHTML = found.length ? head + found.slice(0, limit).map(function (c) { return rowHTML(match(c), 0); }).join('') + more
      : '<li class="empty">「' + esc(state.query) + '」와(과) 맞는 이름이 없어요. 아래에서 생일로 직접 볼 수 있어요.</li>';
  }

  /* ---------- 화면: 결과 ---------- */
  function openResult(person) {
    var r = match(person);
    var key = r.card.no;
    r.isNew = !state.book[key];
    if (r.isNew) { state.book[key] = person.name; save(KEY_BOOK, state.book); }
    var tarot = D.tarot[G.tarotIndex(state.me.ymd, r.prof.ymd, todayYmd(), D.tarot.length)];
    r.tarot = tarot;
    state.result = r;
    go('result');
  }
  function vResult() {
    var r = state.result, c = r.card, me = state.me, p = r.prof;
    var n = bookCount();
    var akey = astroKey(me.sign.element, p.sign.element);
    var label = c.roman + '번 카드 ' + c.name + '. 위쪽은 나의 ' + D.elements[c.top].name + ', 아래쪽은 상대의 ' + D.elements[c.bottom].name + ' 문양';
    return '<section class="view">' +
      '<div class="bar"><button type="button" class="icon-btn" data-act="back" aria-label="뒤로">' + IC.back + '</button>' +
        '<button type="button" class="icon-btn" data-act="book" aria-label="내 카드 도감">' + IC.book + '</button></div>' +
      '<div class="reveal-label">' +
        (r.isNew ? '<span class="new-badge">새 카드 획득</span>' : '') +
        '<span class="eyebrow">나 × ' + esc(r.person.name) + '의</span>' +
        '<span class="display" style="font-size:20px">관계 카드가 뽑혔어요</span></div>' +
      '<div class="card-wrap"><div class="arch flip"><div class="arch-in">' +
        '<span class="roman">' + c.roman + '</span>' + emblemSVG(c, label) +
        '<span class="rule"></span>' +
        '<h1 class="cname">' + esc(c.name) + '</h1>' +
        '<span class="csub">' + esc(c.subtitle) + ' · ' + esc(c.relationLabel) + '</span>' +
        '<span class="cfoot"><span>' + stemLabel(me.stemIndex) + '</span><span class="dash"></span><span class="sc" aria-label="궁합 점수 ' + r.score + '점">' + r.score + '</span><span class="dash"></span><span>' + stemLabel(p.stemIndex) + '</span></span>' +
      '</div></div></div>' +
      '<div class="progress"><span>내 카드 도감</span><span class="bar-track"><span class="bar-fill" style="display:block;width:' + (n * 10) + '%"></span></span><span style="color:var(--fg)">' + n + ' / 10장</span></div>' +
      '<section class="readings" aria-label="카드 풀이"><h2>카드의 세 가지 풀이</h2>' +
        '<div class="reading"><span class="reading-mark">五</span><div class="reading-body"><span class="eyebrow">사주 · ' + stemLabel(me.stemIndex) + ' × ' + stemLabel(p.stemIndex) + '</span>' +
          '<p>' + esc(c.line) + '</p><p>' + esc(D.relationDetail[c.relation]) + '</p></div></div>' +
        '<div class="reading"><span class="reading-mark">' + IC.star + '</span><div class="reading-body"><span class="eyebrow">별자리 · ' + me.sign.ko + ' × ' + p.sign.ko + '</span>' +
          '<p>' + esc(D.astro[akey]) + '</p></div></div>' +
        '<div class="reading"><span class="reading-mark mk">' + r.tarot.roman + '</span><div class="reading-body"><span class="eyebrow">오늘의 타로 · ' + r.tarot.ko + ' (' + r.tarot.en + ')</span>' +
          '<p>' + esc(r.tarot.line) + '</p></div></div>' +
      '</section>' +
      '<div class="stack">' +
        '<button type="button" class="btn" data-act="share">' + IC.save + '스토리 카드 만들기</button>' +
        '<button type="button" class="btn-ghost" data-act="home">다른 사람이랑도 보기</button>' +
      '</div>' +
      '<p class="fine">재미로 보는 풀이예요. 실제 인물과의 관계를 뜻하지 않아요.</p>' +
    '</section>';
  }

  /* ---------- 화면: 도감 ---------- */
  function vBook() {
    var me = state.me, n = bookCount();
    var cells = '';
    for (var j = 0; j < 10; j++) {
      var c = cardFor(me.stemIndex, j);
      var who = state.book[c.no];
      if (who) {
        cells += '<div class="mini"><span class="roman">' + c.roman + '</span>' + emblemSVG(c) +
          '<span class="mname">' + esc(c.name) + '</span><span class="mwho">' + esc(who) + '와(과) 처음 뽑음</span></div>';
      } else {
        cells += '<div class="mini locked"><span class="roman" style="color:var(--faint)">' + c.roman + '</span>' +
          '<span class="q" aria-hidden="true">?</span><span class="mname" style="color:var(--muted)">아직 못 뽑은 카드</span>' +
          '<span class="mwho">상대 일간 ' + stemLabel(j) + '</span></div>';
      }
    }
    return '<section class="view">' +
      '<div class="bar"><button type="button" class="icon-btn" data-act="back" aria-label="뒤로">' + IC.back + '</button><span></span></div>' +
      '<div style="display:flex;flex-direction:column;gap:6px"><span class="small">' + stemLabel(me.stemIndex) + ' · 내 일간으로 뽑을 수 있는 카드</span>' +
      '<h1 class="h1">내 카드 도감 ' + n + ' / 10</h1></div>' +
      '<p class="lede">상대의 일간에 따라 카드가 달라져요. 아직 못 뽑은 카드의 상대 일간을 가진 셀럽을 찾아보세요.</p>' +
      '<div class="book">' + cells + '</div>' +
      '<p class="fine">도감은 이 기기에만 저장돼요.</p>' +
    '</section>';
  }

  /* ---------- 렌더 ---------- */
  function render() {
    if (!state.me && state.view !== 'onboard') state.view = 'onboard';
    var html = { onboard: vOnboard, recs: vRecs, search: vSearch, result: vResult, book: vBook }[state.view]();
    app.innerHTML = html;
    if (state.view === 'search') renderSearchResults();
    var title = { onboard: '최애 궁합', recs: '나랑 찰떡인 셀럽', search: '누구랑 볼까요', result: '관계 카드', book: '내 카드 도감' }[state.view];
    document.title = title === '최애 궁합' ? title : title + ' · 최애 궁합';
  }

  /* ---------- 이벤트 ---------- */
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act'), v = el.getAttribute('data-v');
    if (act === 'back') back();
    else if (act === 'book') go('book');
    else if (act === 'search') { state.query = ''; go('search'); }
    else if (act === 'edit-me') go('onboard');
    else if (act === 'home') { state.stack = []; state.view = 'recs'; render(); window.scrollTo(0, 0); }
    else if (act === 'tab') { state.tab = v; render(); }
    else if (act === 'cat') { state.cat = v; render(); }
    else if (act === 'gender') { state.gender = v; render(); }
    else if (act === 'open') {
      var id = el.getAttribute('data-id');
      var person = CELEBS.filter(function (c) { return c.id === id; })[0];
      if (person) openResult(person);
    } else if (act === 'share') openShare();
  });
  app.addEventListener('input', function (e) {
    if (e.target.id === 'q') { state.query = e.target.value; renderSearchResults(); }
  });
  app.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'f-me') {
      var r = readDate('me');
      if (r.error) { document.getElementById('me-err').textContent = r.error; return; }
      var ymd = G.ymd(r.y, r.m, r.d);
      var changed = !state.me || state.me.ymd !== ymd;
      state.me = G.profile(ymd);
      save(KEY_ME, ymd);
      if (changed) { state.book = {}; save(KEY_BOOK, state.book); }
      state.stack = [];
      state.view = 'recs';
      render();
      window.scrollTo(0, 0);
    } else if (e.target.id === 'f-custom') {
      var c = readDate('c');
      var err = document.getElementById('c-err');
      if (c.error) { err.textContent = c.error; return; }
      var name = document.getElementById('c-name').value.trim() || '그 사람';
      openResult({ id: 'custom', name: name, group: '', category: '', gender: '', birth: G.ymd(c.y, c.m, c.d) });
    }
  });

  /* ---------- 스토리 카드 이미지 (1080×1920) ---------- */
  var sheet = document.getElementById('sheet');
  var sheetImg = document.getElementById('sheet-img');
  var shareBtn = document.getElementById('sheet-share');
  var lastBlob = null, lastUrl = null;

  function svgToImage(svg) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  function archPath(ctx, x, y, w, h, r2) {
    var r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h - r2);
    ctx.arcTo(x + w, y + h, x + w - r2, y + h, r2);
    ctx.lineTo(x + r2, y + h);
    ctx.arcTo(x, y + h, x, y + h - r2, r2);
    ctx.closePath();
  }
  function drawStoryCard() {
    var r = state.result, c = r.card;
    var W = 1080, H = 1920;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var fonts = ['700 80px "Gowun Batang"', '400 40px "IBM Plex Sans KR"', '700 60px "Cinzel"'];
    var fontReady = document.fonts && document.fonts.load ? Promise.all(fonts.map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve();
    return fontReady.then(function () {
      return svgToImage(emblemSVG(c).replace('class="emblem" ', ''));
    }).then(function (emb) {
      ctx.fillStyle = '#0D0B1C'; ctx.fillRect(0, 0, W, H);
      var seed = G.hash(c.name);
      for (var i = 0; i < 70; i++) {
        seed = G.hash(String(seed));
        var sx = seed % W, sy = (seed >>> 11) % H, sr = 1 + (seed % 3) * 0.8;
        ctx.globalAlpha = 0.25 + (seed % 5) / 10;
        ctx.fillStyle = i % 4 === 0 ? '#D8B46A' : '#EFE6D2';
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#A49CB8';
      ctx.font = '400 38px "IBM Plex Sans KR", sans-serif';
      ctx.fillText('나 × ' + r.person.name + '의 관계 카드', W / 2, 190);

      var cw = 680, ch = 1120, cx = (W - cw) / 2, cy = 270;
      archPath(ctx, cx, cy, cw, ch, 32);
      ctx.fillStyle = '#15112A'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#D8B46A'; ctx.stroke();
      archPath(ctx, cx + 20, cy + 20, cw - 40, ch - 40, 20);
      ctx.lineWidth = 2; ctx.strokeStyle = '#5A4B2E'; ctx.stroke();

      ctx.fillStyle = '#D8B46A';
      ctx.font = '500 40px "Cinzel", serif';
      ctx.fillText(c.roman.split('').join(' '), W / 2, cy + 130);
      ctx.drawImage(emb, W / 2 - 240, cy + 165, 480, 480);
      ctx.fillStyle = '#5A4B2E'; ctx.fillRect(W / 2 - 160, cy + 690, 320, 2);
      ctx.fillStyle = '#EFE6D2';
      var nameSize = c.name.length > 8 ? 62 : 76;
      ctx.font = '700 ' + nameSize + 'px "Gowun Batang", serif';
      ctx.fillText(c.name, W / 2, cy + 800);
      ctx.fillStyle = '#C7BFD6';
      ctx.font = '400 34px "IBM Plex Sans KR", sans-serif';
      ctx.fillText(c.subtitle + ' · ' + c.relationLabel, W / 2, cy + 870);
      ctx.fillStyle = '#D8B46A';
      ctx.font = '700 64px "Cinzel", serif';
      ctx.fillText(String(r.score), W / 2, cy + ch - 70);

      ctx.fillStyle = '#EFE6D2';
      ctx.font = '700 52px "Gowun Batang", serif';
      ctx.fillText('너와 최애는 어떤 카드?', W / 2, 1610);
      ctx.fillStyle = '#A49CB8';
      ctx.font = '400 34px "IBM Plex Sans KR", sans-serif';
      var host = (location.host && location.protocol.indexOf('http') === 0 && !/claude|localhost|127\.0/.test(location.host)) ? location.host : '최애 궁합';
      ctx.fillText(host, W / 2, 1680);
      return new Promise(function (res) { cv.toBlob(res, 'image/png'); });
    });
  }
  function openShare() {
    sheet.hidden = false;
    document.getElementById('sheet-msg').textContent = '카드를 그리는 중이에요…';
    sheetImg.removeAttribute('src');
    drawStoryCard().then(function (blob) {
      lastBlob = blob;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      sheetImg.src = lastUrl;
      document.getElementById('sheet-msg').textContent = '휴대폰에서는 이미지를 길게 눌러 저장할 수 있어요.';
      var file = null;
      try { file = new File([blob], 'choiae-card.png', { type: 'image/png' }); } catch (e) {}
      shareBtn.hidden = !(file && navigator.canShare && navigator.canShare({ files: [file] }));
      document.getElementById('sheet-close').focus();
    }).catch(function () {
      document.getElementById('sheet-msg').textContent = '이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.';
    });
  }
  function closeShare() { sheet.hidden = true; }
  document.getElementById('sheet-close').addEventListener('click', closeShare);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeShare(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeShare(); });
  document.getElementById('sheet-save').addEventListener('click', function () {
    if (!lastUrl) return;
    var a = document.createElement('a');
    a.href = lastUrl; a.download = 'choiae-card.png';
    document.body.appendChild(a); a.click(); a.remove();
  });
  shareBtn.addEventListener('click', function () {
    if (!lastBlob) return;
    var file = new File([lastBlob], 'choiae-card.png', { type: 'image/png' });
    navigator.share({ files: [file], title: '최애 궁합' }).catch(function () {});
  });

  /* ---------- 배경 별 ---------- */
  function drawSky() {
    var cv = document.getElementById('sky');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    var seed = 7;
    for (var i = 0; i < Math.round(w * h / 9000); i++) {
      seed = G.hash(String(seed + i));
      ctx.globalAlpha = 0.15 + (seed % 6) / 14;
      ctx.fillStyle = i % 5 === 0 ? '#D8B46A' : '#EFE6D2';
      ctx.beginPath(); ctx.arc(seed % w, (seed >>> 10) % h, 0.6 + (seed % 3) * 0.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  drawSky();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(drawSky, 200); });

  /* ---------- 시작 ---------- */
  state.view = state.me ? 'recs' : 'onboard';
  render();
})();
