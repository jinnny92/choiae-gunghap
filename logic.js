/* 계산 로직: 순수 함수만. 브라우저와 Node 양쪽에서 동작 */
(function (root) {
  var STEM_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

  // 그레고리력 날짜 → 율리우스일(JDN)
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  // 일주(60갑자 순번, 0 = 甲子). 기준: 2000-01-01 = 戊午(54)
  function dayPillarIndex(y, m, d) {
    return ((jdn(y, m, d) + 49) % 60 + 60) % 60;
  }

  // 일간 순번 0~9 (甲~癸)
  function dayStemIndex(y, m, d) {
    return dayPillarIndex(y, m, d) % 10;
  }

  function isValidDate(y, m, d) {
    if (!y || !m || !d) return false;
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  // 태양 별자리 (경계일은 해마다 하루 정도 차이 날 수 있음)
  var SIGNS = [
    { key: 'capricorn', ko: '염소자리', element: 'earth', from: [12, 22] },
    { key: 'aquarius', ko: '물병자리', element: 'air', from: [1, 20] },
    { key: 'pisces', ko: '물고기자리', element: 'water', from: [2, 19] },
    { key: 'aries', ko: '양자리', element: 'fire', from: [3, 21] },
    { key: 'taurus', ko: '황소자리', element: 'earth', from: [4, 20] },
    { key: 'gemini', ko: '쌍둥이자리', element: 'air', from: [5, 21] },
    { key: 'cancer', ko: '게자리', element: 'water', from: [6, 22] },
    { key: 'leo', ko: '사자자리', element: 'fire', from: [7, 23] },
    { key: 'virgo', ko: '처녀자리', element: 'earth', from: [8, 23] },
    { key: 'libra', ko: '천칭자리', element: 'air', from: [9, 23] },
    { key: 'scorpio', ko: '전갈자리', element: 'water', from: [10, 23] },
    { key: 'sagittarius', ko: '사수자리', element: 'fire', from: [11, 22] }
  ];
  function sunSign(m, d) {
    var v = m * 100 + d;
    var order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var result = SIGNS[0]; // 기본: 염소자리 (12/22 ~ 1/19)
    for (var i = 0; i < order.length; i++) {
      var s = SIGNS[order[i]];
      if (v >= s.from[0] * 100 + s.from[1]) result = s;
    }
    if (v >= 1222) result = SIGNS[0];
    return result;
  }

  // 별자리 원소 관계: same(+3) / complement(+2) / other(-2)
  function astroRelation(e1, e2) {
    if (e1 === e2) return 'same';
    var pair = [e1, e2].sort().join('-');
    if (pair === 'air-fire' || pair === 'earth-water') return 'complement';
    return 'other';
  }
  var ASTRO_BONUS = { same: 3, complement: 2, other: -2 };

  function score(baseScore, e1, e2) {
    var s = baseScore + ASTRO_BONUS[astroRelation(e1, e2)];
    return Math.max(60, Math.min(99, s));
  }

  // 간단한 결정적 해시 (FNV-1a)
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function parseYmd(s) {
    var p = String(s).split('-').map(Number);
    return { y: p[0], m: p[1], d: p[2] };
  }

  // 사람(생일) → 사주/별자리 정보
  function profile(birth) {
    var b = typeof birth === 'string' ? parseYmd(birth) : birth;
    var stem = dayStemIndex(b.y, b.m, b.d);
    return {
      y: b.y, m: b.m, d: b.d,
      ymd: ymd(b.y, b.m, b.d),
      stemIndex: stem,
      stem: STEM_HANJA[stem],
      sign: sunSign(b.m, b.d)
    };
  }

  // 오늘의 타로 관계 카드: 두 생일 + 날짜로 결정 (같은 날 같은 둘은 항상 같은 카드)
  function tarotIndex(meYmd, otherYmd, todayYmd, count) {
    return hash(meYmd + '|' + otherYmd + '|' + todayYmd) % count;
  }

  var api = {
    STEM_HANJA: STEM_HANJA,
    SIGNS: SIGNS,
    jdn: jdn,
    dayPillarIndex: dayPillarIndex,
    dayStemIndex: dayStemIndex,
    isValidDate: isValidDate,
    sunSign: sunSign,
    astroRelation: astroRelation,
    score: score,
    hash: hash,
    ymd: ymd,
    parseYmd: parseYmd,
    profile: profile,
    tarotIndex: tarotIndex
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Gunghap = api;
})(this);
