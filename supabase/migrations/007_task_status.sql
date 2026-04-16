-- Add proposal and lost statuses to enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'proposal' BEFORE 'not_started';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'lost' AFTER 'done_unsettled';
