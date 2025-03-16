-- Aggiungi la colonna birth_place alla tabella patients se non esiste già
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'birth_place') THEN
        ALTER TABLE patients ADD COLUMN birth_place VARCHAR(100);
    END IF;
END$$;

-- Aggiorna i pazienti esistenti copiando il valore di birthPlace dal codice fiscale
-- Questa è solo una query di esempio, in un caso reale dovresti implementare
-- una logica più sofisticata per estrarre il luogo di nascita dal codice fiscale
-- o chiedere agli utenti di aggiornare manualmente i dati.

-- UPDATE patients SET birth_place = city WHERE birth_place IS NULL;
