/*
  셀럽 목록 — 여기만 고치면 추천·검색에 반영됩니다.
  지금 들어있는 12명은 화면 확인용 샘플(가상 인물)입니다. 출시 전 실제 데이터로 교체하세요.

  필드
    id        영문/숫자 고유값
    name      표시 이름
    group     소속 그룹·팀·직업 등 (없으면 "")
    category  "idol" | "actor" | "sports" | "creator"
    gender    "m" | "f"
    birth     "YYYY-MM-DD" (양력)

  주의: 생일은 공식 프로필 등으로 반드시 확인하고, 사진은 넣지 마세요.
*/
window.CELEBS = [
  { id: "s01", name: "샘플 아이돌 A", group: "샘플그룹 하나", category: "idol", gender: "f", birth: "2001-03-14" },
  { id: "s02", name: "샘플 아이돌 B", group: "샘플그룹 하나", category: "idol", gender: "f", birth: "2002-07-09" },
  { id: "s03", name: "샘플 아이돌 C", group: "샘플그룹 둘", category: "idol", gender: "m", birth: "1998-11-27" },
  { id: "s04", name: "샘플 아이돌 D", group: "샘플그룹 둘", category: "idol", gender: "m", birth: "2000-01-05" },
  { id: "s05", name: "샘플 아이돌 E", group: "샘플그룹 셋", category: "idol", gender: "m", birth: "1999-05-30" },
  { id: "s06", name: "샘플 배우 F", group: "배우", category: "actor", gender: "f", birth: "1994-09-02" },
  { id: "s07", name: "샘플 배우 G", group: "배우", category: "actor", gender: "m", birth: "1991-12-18" },
  { id: "s08", name: "샘플 배우 H", group: "배우", category: "actor", gender: "f", birth: "1997-04-23" },
  { id: "s09", name: "샘플 선수 I", group: "축구", category: "sports", gender: "m", birth: "1995-08-08" },
  { id: "s10", name: "샘플 선수 J", group: "배구", category: "sports", gender: "f", birth: "1998-02-16" },
  { id: "s11", name: "샘플 크리에이터 K", group: "유튜버", category: "creator", gender: "m", birth: "1993-06-11" },
  { id: "s12", name: "샘플 크리에이터 L", group: "유튜버", category: "creator", gender: "f", birth: "2000-10-29" }
];
