-- Erstelle die Tickets-Tabelle mit projektspezifischer Ticket-Nummerierung
-- Jedes Projekt beginnt mit #1 und hat seine eigene Sequenz

-- Erstelle die Tickets-Tabelle
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Eindeutigkeit nur innerhalb eines Projekts (project_id + ticket_number)
  CONSTRAINT tickets_project_ticket_number_unique UNIQUE (project_id, ticket_number)
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets(due_date);
CREATE INDEX IF NOT EXISTS idx_tickets_project_ticket_number ON tickets(project_id, ticket_number);

-- Erstelle eine Funktion, die die nächste Ticket-Nummer pro Projekt berechnet
CREATE OR REPLACE FUNCTION get_next_ticket_number(p_project_id UUID)
RETURNS BIGINT AS $$
DECLARE
  next_number BIGINT;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1
  INTO next_number
  FROM tickets
  WHERE project_id = p_project_id;
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Erstelle eine Funktion für den Trigger, der automatisch die ticket_number setzt
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur setzen, wenn ticket_number noch nicht gesetzt ist (NULL oder 0)
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = 0 THEN
    NEW.ticket_number := get_next_ticket_number(NEW.project_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle den Trigger für automatische Ticket-Nummerierung
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Erstelle einen Trigger, der updated_at automatisch aktualisiert
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) aktivieren
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur Tickets ihrer eigenen Projekte sehen
CREATE POLICY "Users can view tickets of their own projects"
  ON tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Policy: Benutzer können nur Tickets für ihre eigenen Projekte erstellen
CREATE POLICY "Users can create tickets for their own projects"
  ON tickets
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Policy: Benutzer können nur Tickets ihrer eigenen Projekte aktualisieren
CREATE POLICY "Users can update tickets of their own projects"
  ON tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Policy: Benutzer können nur Tickets ihrer eigenen Projekte löschen
CREATE POLICY "Users can delete tickets of their own projects"
  ON tickets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND projects.created_by = auth.uid()
    )
  );

