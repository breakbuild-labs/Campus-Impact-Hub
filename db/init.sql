-- ============================================================================
-- Campus Impact Hub - PostgreSQL Database Schema & Initial Seed
-- Non-Destructive Relational Schema (No Open Recruitment / No QR Ticket)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    identity_number VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    account_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    major_or_unit VARCHAR(255),
    faculty VARCHAR(255),
    study_program VARCHAR(255),
    phone VARCHAR(100),
    owner_name VARCHAR(255),
    address TEXT,
    status VARCHAR(100),
    impact_score INTEGER DEFAULT 0,
    leadership_score INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    umkm_helped INTEGER DEFAULT 0,
    beneficiaries_reached INTEGER DEFAULT 0,
    contribution_hours INTEGER DEFAULT 0,
    bio TEXT,
    interests JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    owner_user_id VARCHAR(64),
    name VARCHAR(150) NOT NULL,
    full_name VARCHAR(255),
    category VARCHAR(100),
    level VARCHAR(100) DEFAULT 'Universitas',
    affiliation VARCHAR(255),
    chairman_name VARCHAR(255),
    logo_initials VARCHAR(10),
    sk_number VARCHAR(150),
    sk_document_name VARCHAR(255),
    sk_document_type VARCHAR(100),
    sk_document_size INTEGER DEFAULT 0,
    sk_document_data TEXT,
    advisor_name VARCHAR(255),
    contact VARCHAR(255),
    activity_field VARCHAR(255),
    description TEXT,
    member_count INTEGER DEFAULT 1,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    owner_user_id VARCHAR(64),
    organization_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    location VARCHAR(255),
    photo_caption VARCHAR(255),
    attachment_name VARCHAR(255),
    expected_outcomes TEXT,
    expected_duration VARCHAR(100),
    impact_score INTEGER DEFAULT 85,
    requirements JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    rejection_reason TEXT,
    verified_by_admin BOOLEAN DEFAULT false,
    applicant_count INTEGER DEFAULT 0,
    milestones JSONB DEFAULT '[]'::jsonb,
    assigned_students JSONB DEFAULT '[]'::jsonb,
    impact_report JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64),
    owner_user_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    organizer_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'WORKSHOP',
    description TEXT,
    date VARCHAR(150),
    registration_deadline VARCHAR(150),
    location VARCHAR(255),
    quota INTEGER DEFAULT 100,
    registered_count INTEGER DEFAULT 0,
    points_reward INTEGER DEFAULT 10,
    committee_points_reward INTEGER DEFAULT 20,
    poster_summary TEXT,
    publication_status VARCHAR(50) DEFAULT 'PUBLISHED',
    verified_by_admin BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255),
    student_nim VARCHAR(100),
    faculty VARCHAR(255),
    study_program VARCHAR(255),
    role_in_event VARCHAR(50) DEFAULT 'Participant',
    registration_status VARCHAR(50) DEFAULT 'Registered',
    attendance_status VARCHAR(50) DEFAULT 'Registered',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_in_timestamp VARCHAR(100),
    validated_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS project_registrations (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255),
    student_nim VARCHAR(100),
    faculty VARCHAR(255),
    study_program VARCHAR(255),
    role_in_project VARCHAR(100) DEFAULT 'Member',
    status VARCHAR(50) DEFAULT 'APPROVED',
    points_awarded BOOLEAN DEFAULT false,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_evaluations (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    project_title VARCHAR(255),
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255),
    student_nim VARCHAR(100),
    partner_id VARCHAR(64) NOT NULL,
    partner_name VARCHAR(255),
    ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
    average_score NUMERIC(4,2) DEFAULT 5.00,
    comment TEXT,
    verified_by_admin BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolio_entries (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    activity_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    organization_or_partner VARCHAR(255),
    category VARCHAR(100),
    date VARCHAR(100),
    impact_points INTEGER DEFAULT 0,
    leadership_points INTEGER DEFAULT 0,
    verification_status VARCHAR(50) DEFAULT 'VERIFIED',
    verified_by VARCHAR(255),
    outcome_summary TEXT,
    credential_code VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64),
    actor_name VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(150) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_session (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
