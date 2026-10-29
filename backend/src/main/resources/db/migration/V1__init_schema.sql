-- ==============================================================================
-- CareQueue Schema Migration V1: Patients Table and Indexes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    department VARCHAR(50) NOT NULL,
    registration_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    called_time TIMESTAMP WITH TIME ZONE,
    completed_time TIMESTAMP WITH TIME ZONE,
    notes VARCHAR(250)
);

CREATE INDEX IF NOT EXISTS idx_patient_status ON patients (status);
CREATE INDEX IF NOT EXISTS idx_patient_registration_time ON patients (registration_time);
CREATE INDEX IF NOT EXISTS idx_patient_token_number ON patients (token_number);
