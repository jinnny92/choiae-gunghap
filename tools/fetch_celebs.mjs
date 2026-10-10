// Wikidata에서 한국 가수·아이돌·배우의 생일을 받아 celebs.js를 다시 만든다.
// 실행: node tools/fetch_celebs.mjs            (Wikidata에서 받아오기)
//       node tools/fetch_celebs.mjs --from x.json (저장해 둔 응답으로 테스트)
// 의존성 없음. Node 18 이상.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'celebs.js');
const OVERRIDES = join(ROOT, 'tools', 'celebs-overrides.json');

const MIN_SITELINKS = 4;   // 위키 문서가 이 언어 수 이상인 사람만 (너무 무명인 사람 제외)
const MAX_PEOPLE = 4000;   // 목록 최대 인원
const MIN_EXPECTED = 200;  // 이보다 적게 받으면 뭔가 잘못된 것 → 기존 파일 유지

const SINGER = ['Q177220', 'Q2252262', 'Q5716684', 'Q488205']; // 가수, 래퍼, 댄서, 싱어송라이터
const ACTOR = ['Q33999', 'Q10800557', 'Q10798782'];            // 배우, 영화배우, TV배우

const QUERY = `
SELECT ?p ?name ?b ?gender ?links ?occ (SAMPLE(?gl) AS ?group) WHERE {
  VALUES ?occ { ${[...SINGER, ...ACTOR].map((q) => 'wd:' + q).join(' ')} }
  ?p wdt:P106 ?occ ;
     wdt:P27 wd:Q884 ;
     wdt:P31 wd:Q5 ;
     wikibase:sitelinks ?links ;
     p:P569/psv:P569 [ wikibase:timeValue ?b ; wikibase:timePrecision 11 ] .
  FILTER(?links >= ${MIN_SITELINKS})
  FILTER NOT EXISTS { ?p wdt:P570 [] }
  ?p rdfs:label ?name . FILTER(LANG(?name) = "ko")
  OPTIONAL { ?p wdt:P21 ?gender }
  OPTIONAL { ?p wdt:P463 ?g . ?g rdfs:label ?gl . FILTER(LANG(?gl) = "ko") }
}
GROUP BY ?p ?name ?b ?gender ?links ?occ`;

async function fetchWikidata() {
  const res = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
      'User-Agent': 'choiae-gunghap-celeb-sync/1.0 (static fan app; weekly)'
    },
    body: 'query=' + encodeURIComponent(QUERY)
  });
  if (!res.ok) throw new Error('Wikidata 응답 오류 ' + res.status + ': ' + (await res.text()).slice(0, 300));
  return res.json();
}

const qid = (uri) => (uri || '').split('/').pop();

export function transform(json, overrides = {}) {
  const people = new Map();
  for (const row of json.results.bindings) {
    const id = qid(row.p.value);
    const date = row.b.value.slice(0, 10).replace(/^\+/, ''); // "1995-09-01"
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    let p = people.get(id);
    if (!p) {
      p = { id, name: row.name.value, births: new Set(), occ: new Set(), gender: '', group: '', pop: +row.links.value };
      people.set(id, p);
    }
    p.births.add(date);
    p.occ.add(qid(row.occ.value));
    const g = qid(row.gender && row.gender.value);
    if (g === 'Q6581097') p.gender = 'm';
    else if (g === 'Q6581072') p.gender = 'f';
    if (row.group && !p.group) p.group = row.group.value;
  }

  const exclude = new Set(overrides.exclude || []);
  const fix = overrides.fix || {};
  let list = [];
  for (const p of people.values()) {
    if (exclude.has(p.id)) continue;
    if (p.births.size !== 1) continue; // 출처마다 생일이 다르면 제외
    const birth = [...p.births][0];
    const y = +birth.slice(0, 4);
    if (y < 1940 || y > new Date().getFullYear() - 10) continue;
    // 그룹 소속이 있거나, 배우 직업이 없는 가수만 '아이돌·가수'. 노래도 낸 배우는 배우로.
    const isActor = ACTOR.some((q) => p.occ.has(q));
    const isSinger = SINGER.some((q) => p.occ.has(q)) && (!!p.group || !isActor);
    const category = isSinger ? 'idol' : 'actor';
    const item = {
      id: p.id,
      name: p.name,
      group: p.group || (isSinger ? '가수' : '배우'),
      category,
      gender: p.gender,
      birth,
      pop: p.pop
    };
    list.push(Object.assign(item, fix[p.id] || {}));
  }
  for (const add of overrides.add || []) list.push(add);

  list.sort((a, b) => (b.pop || 0) - (a.pop || 0) || a.name.localeCompare(b.name, 'ko'));
  return list.slice(0, MAX_PEOPLE);
}

function writeCelebs(list) {
  const stamp = new Date().toISOString().slice(0, 10);
  const body =
    '/* 자동 생성: tools/fetch_celebs.mjs (' + stamp + ')\n' +
    '   출처: Wikidata (CC0). 직접 고치지 말고 tools/celebs-overrides.json을 수정하세요. */\n' +
    'window.CELEBS = [\n' + list.map((c) => '  ' + JSON.stringify(c)).join(',\n') + '\n];\n';
  writeFileSync(OUT, body, 'utf8');
}

async function main() {
  const fromIdx = process.argv.indexOf('--from');
  const json = fromIdx > 0 ? JSON.parse(readFileSync(process.argv[fromIdx + 1], 'utf8')) : await fetchWikidata();
  const overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf8')) : {};
  const list = transform(json, overrides);
  const min = fromIdx > 0 ? 1 : MIN_EXPECTED;
  if (list.length < min) {
    console.error('받은 인원이 ' + list.length + '명뿐이라 기존 celebs.js를 그대로 둡니다.');
    process.exit(1);
  }
  writeCelebs(list);
  const idol = list.filter((c) => c.category === 'idol').length;
  console.log('celebs.js 갱신: ' + list.length + '명 (가수·아이돌 ' + idol + ', 배우 ' + (list.length - idol) + ')');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
