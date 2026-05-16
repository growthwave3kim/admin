-- 스레드 계정 3개 운영: 게시글이 어떤 페르소나(계정)용인지 기록
-- growth_hacker | strategist | field_expert (기존 행은 NULL — 페르소나 도입 이전)
alter table threads_posts
  add column if not exists persona text;

comment on column threads_posts.persona is
  'Threads 페르소나/계정: growth_hacker | strategist | field_expert';
