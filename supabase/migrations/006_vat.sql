-- VAT fields on tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS vat_included boolean NOT NULL DEFAULT false;
