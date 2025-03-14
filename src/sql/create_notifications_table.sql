CREATE TABLE IF NOT EXISTS "notifications" (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES "patients"(id) ON DELETE CASCADE,
  patient_name VARCHAR(100) NOT NULL,
  appointment_id INTEGER REFERENCES "appointments"(id) ON DELETE SET NULL,
  appointment_date DATE,
  appointment_time TIME,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  type VARCHAR(20) NOT NULL,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);