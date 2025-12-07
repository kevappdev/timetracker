-- Erstelle die Zeiterfassungs-Tabelle
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_ticket_id ON time_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_end_time ON time_entries(end_time);

-- Erstelle einen Trigger, der updated_at automatisch aktualisiert
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Erstelle eine Funktion, die die Dauer automatisch berechnet
CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  ELSE
    NEW.duration_minutes := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle einen Trigger für automatische Dauerberechnung
CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_duration();

-- RLS (Row Level Security) aktivieren
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Zeiterfassungen sehen
CREATE POLICY "Users can view their own time entries"
  ON time_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Benutzer können nur ihre eigenen Zeiterfassungen erstellen
CREATE POLICY "Users can create their own time entries"
  ON time_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = time_entries.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Policy: Benutzer können nur ihre eigenen Zeiterfassungen aktualisieren
CREATE POLICY "Users can update their own time entries"
  ON time_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Benutzer können nur ihre eigenen Zeiterfassungen löschen
CREATE POLICY "Users can delete their own time entries"
  ON time_entries
  FOR DELETE
  USING (auth.uid() = user_id);

