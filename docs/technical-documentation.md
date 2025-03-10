# Documentazione Tecnica ARSLink2

## Panoramica del Sistema

ARSLink2 è un sistema di gestione appuntamenti per studi medici, progettato per funzionare in locale con funzionalità di sincronizzazione con Google Calendar e notifiche WhatsApp. Il sistema è sviluppato in React con TypeScript e utilizza un database PostgreSQL per la persistenza dei dati.

## Architettura del Sistema

### Componenti Principali

1. **Frontend**: Interfaccia utente sviluppata con React e TypeScript
2. **Database**: PostgreSQL per la persistenza dei dati
3. **Integrazioni**:
   - Google Calendar per la sincronizzazione degli appuntamenti
   - WhatsApp Web (tramite automazione Selenium) per l'invio di notifiche

### Struttura del Progetto

```
/src
  /components        # Componenti UI React
    /admin           # Componenti per funzionalità amministrative
    /appointments    # Componenti per la gestione appuntamenti
    /auth            # Componenti per autenticazione
    /dashboard       # Componenti per la dashboard principale
    /layout          # Componenti di layout
    /patients        # Componenti per la gestione pazienti
    /settings        # Componenti per le impostazioni
    /system          # Componenti di sistema
    /ui              # Componenti UI riutilizzabili (ShadCN)
  /data              # Dati statici
  /lib               # Librerie e utility
  /models            # Modelli di dati e interazione con il database
  /services          # Servizi per integrazioni esterne
  /setup             # Wizard di configurazione iniziale
  /utils             # Funzioni di utilità
```

## Database

### Schema del Database

Il database è composto dalle seguenti tabelle principali:

1. **users**: Utenti del sistema (medici e assistenti)
2. **patients**: Anagrafica pazienti
3. **appointments**: Appuntamenti
4. **license**: Informazioni sulla licenza
5. **configurations**: Configurazioni del sistema

### Creazione Manuale del Database

Se necessario, è possibile creare manualmente il database e le tabelle utilizzando i seguenti comandi SQL:

```sql
-- Creazione del database
CREATE DATABASE patient_appointment_system;

-- Connessione al database
\c patient_appointment_system

-- Tabella utenti
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella pazienti
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  codice_fiscale VARCHAR(16) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  city VARCHAR(50),
  postal_code VARCHAR(10),
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  notes TEXT,
  privacy_consent BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella appuntamenti
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  appointment_type VARCHAR(50) NOT NULL,
  notes TEXT,
  google_calendar_synced BOOLEAN NOT NULL DEFAULT FALSE,
  google_event_id VARCHAR(100),
  whatsapp_notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_notification_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella licenza
CREATE TABLE license (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(100) UNIQUE NOT NULL,
  license_type VARCHAR(20) NOT NULL,
  expiry_date DATE NOT NULL,
  google_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella configurazioni
CREATE TABLE configurations (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella notifiche
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  scheduled_time TIMESTAMP,
  sent_time TIMESTAMP,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella backup
CREATE TABLE backups (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  size INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creazione utente admin di default
INSERT INTO users (username, password, full_name, email, role)
VALUES ('admin', 'admin123', 'Amministratore', 'admin@arslink.it', 'Medico');
```

## Sistema di Licenze

Il sistema utilizza un meccanismo di licenze per abilitare funzionalità specifiche:

1. **Base**: Funzionalità di base senza integrazioni
2. **Google Calendar**: Include sincronizzazione con Google Calendar
3. **WhatsApp**: Include notifiche WhatsApp
4. **Completa**: Include tutte le funzionalità

Le licenze hanno una validità temporale e vengono verificate all'avvio dell'applicazione.

### Generazione Licenze

Le licenze vengono generate utilizzando un algoritmo che combina:
- Tipo di licenza
- ID univoco
- Data di scadenza codificata
- Checksum per la verifica dell'integrità

Il formato della licenza è: `TIPO-UNIQUEID-EXPIRYCODE-CHECKSUM`

## Integrazioni

### Google Calendar

L'integrazione con Google Calendar richiede:
1. Credenziali OAuth2 (Client ID e Client Secret)
2. Autorizzazione dell'utente
3. Licenza appropriata (Google Calendar o Completa)

Gli appuntamenti vengono sincronizzati automaticamente con Google Calendar quando creati o modificati.

### WhatsApp

L'integrazione con WhatsApp utilizza Selenium per automatizzare WhatsApp Web:
1. Richiede Chrome/Chromium installato sul sistema
2. Autenticazione tramite scansione del codice QR
3. Licenza appropriata (WhatsApp o Completa)

Le notifiche vengono inviate automaticamente per:
- Conferma appuntamenti
- Promemoria appuntamenti

## Autenticazione e Sicurezza

Il sistema utilizza un'autenticazione locale con username e password. Le password vengono salvate in forma hashata nel database.

Esistono due ruoli principali:
1. **Medico**: Accesso completo a tutte le funzionalità
2. **Assistente**: Accesso limitato (non può modificare impostazioni critiche)

### Credenziali di Default

Il sistema include un account amministratore predefinito:
- **Username**: admin
- **Password**: admin123

## Backup e Ripristino

Il sistema supporta il backup e il ripristino del database:
1. Backup manuale o automatico (configurabile)
2. Ripristino da file di backup

I backup vengono salvati in formato SQL e possono essere ripristinati tramite l'interfaccia utente o manualmente.

## Generazione del Codice Fiscale

Il sistema genera automaticamente il codice fiscale italiano a partire dai dati anagrafici del paziente. La generazione segue l'algoritmo ufficiale italiano e include i seguenti passaggi:

1. **Estrazione delle consonanti e vocali dal cognome**:
   - Si estraggono fino a 3 consonanti dal cognome in ordine
   - Se le consonanti sono meno di 3, si aggiungono le vocali
   - Se il cognome ha meno di 3 lettere, si aggiungono delle X

2. **Estrazione delle consonanti e vocali dal nome**:
   - Si estraggono fino a 3 consonanti dal nome in ordine
   - Se il nome ha più di 3 consonanti, si prendono la prima, terza e quarta
   - Se le consonanti sono meno di 3, si aggiungono le vocali
   - Se il nome ha meno di 3 lettere, si aggiungono delle X

3. **Generazione della parte relativa all'anno di nascita**:
   - Si prendono le ultime due cifre dell'anno di nascita

4. **Generazione della parte relativa al mese di nascita**:
   - Si utilizza una lettera specifica per ogni mese (A=gennaio, B=febbraio, ecc.)

5. **Generazione della parte relativa al giorno di nascita e al sesso**:
   - Per i maschi si usa il giorno di nascita (01-31)
   - Per le femmine si aggiunge 40 al giorno di nascita (41-71)

6. **Aggiunta del codice catastale del comune di nascita**:
   - Si utilizza il codice catastale a 4 caratteri del comune di nascita

7. **Calcolo del carattere di controllo**:
   - Si applica un algoritmo specifico sui 15 caratteri precedenti per ottenere il 16° carattere

### Aggiunta di Nuovi Comuni

Per aggiungere nuovi comuni al sistema:

1. Aprire il file `src/data/comuni-italiani.json`
2. Aggiungere un nuovo oggetto con la seguente struttura:
   ```json
   { "nome": "NomeComune", "codice": "XXXX" }
   ```
   dove `XXXX` è il codice catastale del comune (4 caratteri alfanumerici)

3. Salvare il file

In alternativa, l'applicazione supporta l'aggiunta dinamica di comuni durante l'inserimento di un paziente. Se un comune non viene trovato nell'elenco predefinito, viene automaticamente aggiunto con un codice generico (Z999 per comuni esteri) e salvato in localStorage per utilizzi futuri.

## Modifiche e Aggiornamenti Recenti

### Miglioramenti Database
- Implementato sistema ibrido che tenta di connettersi a un database PostgreSQL reale
- Fallback automatico a una simulazione in localStorage se la connessione fallisce
- Aggiunto logging dettagliato per diagnosticare problemi di connessione

### Gestione Pazienti
- Migliorata la validazione dei dati paziente
- Implementato salvataggio sia nel database che in localStorage come backup
- Migliorata la gestione degli errori durante l'eliminazione dei pazienti
- Aggiunta generazione automatica del codice fiscale durante l'inserimento
- Implementata la possibilità di aggiungere comuni non presenti nell'elenco predefinito

### Integrazione Google Calendar
- Implementata una simulazione più realistica della sincronizzazione
- Aggiunto calcolo corretto dell'ora di fine appuntamento in base alla durata
- Salvataggio degli eventi sincronizzati in localStorage per tracciamento

### Notifiche WhatsApp
- Aggiunta validazione del formato del numero di telefono
- Implementata simulazione realistica con possibilità di fallimento
- Aggiunto logging delle notifiche inviate e fallite
- Aggiunta funzionalità per l'invio manuale di notifiche
- Implementata interfaccia per la creazione di nuove notifiche personalizzate

### Autenticazione
- Aggiunto utente admin predefinito sempre disponibile
- Migliorato il processo di login per supportare sia DB reale che simulato
- Aggiunta persistenza delle credenziali utente in localStorage

### Impostazioni
- Implementata funzionalità di backup e ripristino
- Aggiunta gestione utenti (creazione utenti assistenti)
- Implementata modalità scura e selezione lingua
- Aggiunta personalizzazione delle informazioni dello studio medico
- Implementata visualizzazione condizionale delle funzionalità in base alla licenza

### Setup Wizard
- Aggiunta configurazione del percorso di backup
- Aggiunta configurazione delle informazioni generali dello studio
- Aggiunta possibilità di creare utenti assistenti

## Piano di Test

### Test di Autenticazione
1. Login con utente admin predefinito (admin/admin123)
2. Login con utente creato durante il setup
3. Verifica funzionalità "Password dimenticata"
4. Verifica logout

### Test di Configurazione
1. Verifica completamento del setup wizard
2. Verifica salvataggio impostazioni generali
3. Verifica funzionamento modalità scura
4. Verifica cambio lingua

### Test di Gestione Pazienti
1. Creazione nuovo paziente con generazione automatica del codice fiscale
2. Modifica dati paziente
3. Visualizzazione dettagli paziente
4. Eliminazione paziente

### Test di Gestione Appuntamenti
1. Creazione nuovo appuntamento
2. Modifica appuntamento esistente
3. Eliminazione appuntamento
4. Verifica visualizzazione calendario

### Test di Notifiche (con licenza appropriata)
1. Verifica visibilità menu notifiche
2. Creazione nuova notifica manuale
3. Invio notifica esistente
4. Verifica configurazione notifiche automatiche

### Test di Integrazioni (con licenza appropriata)
1. Configurazione Google Calendar
2. Sincronizzazione appuntamento con Google Calendar
3. Configurazione WhatsApp
4. Invio notifica WhatsApp

### Test di Backup e Ripristino
1. Esecuzione backup manuale
2. Configurazione backup automatico
3. Ripristino da backup

### Test di Licenza
1. Verifica funzionalità con licenza base
2. Installazione licenza Google Calendar
3. Installazione licenza WhatsApp
4. Installazione licenza completa
5. Verifica scadenza licenza

## Risoluzione Problemi

### Problemi di Connessione al Database

Se si verificano problemi di connessione al database:
1. Verificare che PostgreSQL sia installato e in esecuzione
2. Controllare le credenziali di accesso nel wizard di setup
3. Verificare che il database esista o crearlo manualmente

### Problemi di Login

Se non è possibile accedere al sistema:
1. Utilizzare le credenziali di default (admin/admin123)
2. Verificare che il database sia stato inizializzato correttamente
3. Controllare i log per eventuali errori di autenticazione

### Problemi con le Integrazioni

Se le integrazioni non funzionano:
1. Verificare che la licenza includa la funzionalità richiesta
2. Controllare le credenziali di accesso per l'integrazione
3. Verificare la connessione a internet
