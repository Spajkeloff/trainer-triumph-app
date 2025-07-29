-- Add comprehensive client management fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS injuries TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medications TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fitness_goals TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferences TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_trainer_id UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create client notes table
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general', -- general, medical, progress, session
  title TEXT,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- assessment, photo, contract, medical
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client assessments table
CREATE TABLE IF NOT EXISTS client_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL,
  assessment_date DATE DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2),
  body_fat_percentage DECIMAL(5,2),
  muscle_mass DECIMAL(5,2),
  measurements JSONB, -- Store body measurements as JSON
  fitness_level TEXT, -- beginner, intermediate, advanced
  assessment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client messages table for communication
CREATE TABLE IF NOT EXISTS client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL, -- trainer or client user_id
  sender_type TEXT NOT NULL CHECK (sender_type IN ('trainer', 'client')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assessments_client_id ON client_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_client_id ON client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_trainer ON clients(assigned_trainer_id);

-- Enable RLS on new tables
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_client_notes_updated_at BEFORE UPDATE ON client_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_assessments_updated_at BEFORE UPDATE ON client_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();