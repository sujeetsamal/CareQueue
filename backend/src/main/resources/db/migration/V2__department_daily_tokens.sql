-- ==============================================================================
-- CareQueue Schema Migration V2: Department Daily Token Counters & Fields
-- ==============================================================================

-- 1. Atomic counter table for per-department, per-day sequence allocation
CREATE TABLE IF NOT EXISTS department_daily_tokens (
    queue_date DATE NOT NULL,
    department_code VARCHAR(10) NOT NULL,
    last_sequence INT NOT NULL,
    PRIMARY KEY (queue_date, department_code)
);

-- 2. Add structured token tracking columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS queue_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS department_code VARCHAR(10);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS sequence_number INT;

-- 3. Composite index for fast daily token queries
CREATE INDEX IF NOT EXISTS idx_patients_date_dept ON patients (queue_date, department_code);
