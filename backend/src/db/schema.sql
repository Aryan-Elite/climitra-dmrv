-- Run this in Supabase SQL editor

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('field_worker', 'reviewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captures
CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_bucket TEXT NOT NULL,
  image_path TEXT NOT NULL,
  image_hash TEXT,
  document_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'needs_review',
    'approved', 'rejected', 'escalated', 'possible_duplicate'
  )),
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  duplicate_of UUID REFERENCES captures(id)
);

-- Capture Fields (OCR results per field)
CREATE TABLE capture_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  ocr_value TEXT,
  current_value TEXT,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  is_human_corrected BOOLEAN DEFAULT FALSE,
  corrected_by UUID REFERENCES users(id),
  corrected_at TIMESTAMPTZ
);

-- Capture Events (append-only audit log)
CREATE TABLE capture_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'uploaded', 'processing_started', 'ocr_completed',
    'field_corrected', 'approved', 'rejected', 'escalated',
    'duplicate_flagged', 'duplicate_confirmed'
  )),
  actor_id UUID REFERENCES users(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'human')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search performance
CREATE INDEX idx_captures_status ON captures(status);
CREATE INDEX idx_captures_uploaded_by ON captures(uploaded_by);
CREATE INDEX idx_captures_uploaded_at ON captures(uploaded_at);
CREATE INDEX idx_capture_fields_capture_id ON capture_fields(capture_id);
CREATE INDEX idx_capture_fields_confidence ON capture_fields(confidence);
CREATE INDEX idx_capture_events_capture_id ON capture_events(capture_id);
CREATE INDEX idx_captures_image_hash ON captures(image_hash);

-- Seed test users (password: "password123" for both)
INSERT INTO users (email, password_hash, name, role) VALUES
  ('ram@climitra.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ram Singh', 'field_worker'),
  ('reviewer@climitra.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HQ Reviewer', 'reviewer');
