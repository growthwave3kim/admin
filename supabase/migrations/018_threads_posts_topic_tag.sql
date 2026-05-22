-- Threads 알고리즘 비팔로워 노출 최적화: 토픽 태그 1개 per 글
-- 태그 풀은 페르소나별로 고정 (AI가 임의 생성 방지)
alter table threads_posts
  add column if not exists topic_tag text;

comment on column threads_posts.topic_tag is
  'Threads 토픽 태그 (비팔로워 노출용). 페르소나별 고정 풀에서 선택: growth_hacker(마케팅성과/전환율/데이터마케팅/퍼포먼스마케팅/디지털마케팅) | strategist(마케팅전략/브랜딩/고객심리/포지셔닝/콘텐츠마케팅) | field_expert(전문직마케팅/개업마케팅/변호사마케팅/세무사마케팅/한의원마케팅) | agency_brand(전문직마케팅/마케팅대행사/콘텐츠전략/그로스웨이브)';
