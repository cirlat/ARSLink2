# Setup Wizard - Sistema Gestione Appuntamenti

Questo è un'applicazione standalone per la configurazione iniziale del Sistema di Gestione Appuntamenti.

## Istruzioni

1. Apri il file `index.html` in un browser web o esegui l'applicazione standalone
2. Segui i passaggi guidati per configurare il sistema:
   - Configurazione Database PostgreSQL
   - Creazione Utente Amministratore
   - Installazione Licenza
   - Configurazione Google Calendar (se disponibile)
   - Configurazione WhatsApp (se disponibile)
   - Configurazione Server
   - Configurazione Backup
   - Impostazioni Generali

## Note Tecniche

Questo setup wizard è separato dall'applicazione principale per facilitare i test e la configurazione iniziale. Una volta completato il setup, i dati di configurazione vengono salvati e l'applicazione principale può essere avviata.

## Requisiti

- PostgreSQL installato e in esecuzione
- Chrome (per l'integrazione WhatsApp, se utilizzata)
- Connessione Internet (per l'integrazione Google Calendar, se utilizzata)

## Sviluppo

Per eseguire il setup wizard in modalità sviluppo, è possibile utilizzare un server web locale come Live Server di VS Code o http-server di Node.js.

```bash
npm install -g http-server
cd setup-wizard
http-server
```

Per integrare il setup wizard nell'applicazione Electron, è possibile creare una finestra separata che carica il file index.html del setup wizard.
