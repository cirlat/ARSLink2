# Piano di Test - Sistema di Gestione Appuntamenti

## Introduzione

Questo documento descrive il piano di test per verificare il corretto funzionamento del Sistema di Gestione Appuntamenti. I test sono organizzati per moduli funzionali e coprono sia i flussi principali che i casi limite.

## Prerequisiti

- Sistema operativo: Windows 10 o superiore
- Browser: Chrome, Firefox o Edge aggiornato all'ultima versione
- Connessione internet (per le integrazioni con Google Calendar e WhatsApp)

## Moduli da Testare

1. Setup Iniziale e Configurazione
2. Autenticazione e Gestione Utenti
3. Dashboard e Navigazione
4. Gestione Pazienti
5. Gestione Appuntamenti
6. Notifiche WhatsApp
7. Integrazione Google Calendar
8. Backup e Ripristino
9. Impostazioni
10. Gestione Licenze

## Test Case Aggiuntivi

### 11. Template Notifiche WhatsApp

#### 11.1 Creazione Nuovo Template

- **Descrizione**: Verifica che la creazione di un nuovo template funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Notifiche"
  2. Scorri fino alla sezione "Template Notifiche WhatsApp"
  3. Clicca su "Nuovo Template"
  4. Compila tutti i campi del form
  5. Clicca su "Crea Template"
- **Risultato atteso**: Il nuovo template viene creato e appare nella lista dei template.

#### 11.2 Modifica Template

- **Descrizione**: Verifica che la modifica di un template funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Notifiche"
  2. Trova un template esistente e clicca sull'icona di modifica
  3. Modifica alcuni campi
  4. Clicca su "Salva Modifiche"
- **Risultato atteso**: Le modifiche vengono salvate e il template aggiornato appare nella lista.

#### 11.3 Eliminazione Template

- **Descrizione**: Verifica che l'eliminazione di un template funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Notifiche"
  2. Trova un template esistente e clicca sull'icona di eliminazione
  3. Conferma l'eliminazione
- **Risultato atteso**: Il template viene eliminato e non appare più nella lista.

### 12. Backup e Ripristino Reale

#### 12.1 Backup Manuale Reale

- **Descrizione**: Verifica che il backup manuale reale funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Backup e Ripristino"
  2. Inserisci un percorso valido nel campo "Percorso Backup"
  3. Clicca su "Esegui Backup Manuale"
- **Risultato atteso**: Il backup viene eseguito correttamente e viene creato un file nel percorso specificato.

#### 12.2 Ripristino da Backup Reale

- **Descrizione**: Verifica che il ripristino da backup reale funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Backup e Ripristino"
  2. Clicca su "Ripristina da Backup"
  3. Seleziona un file di backup valido
  4. Conferma il ripristino
- **Risultato atteso**: I dati vengono ripristinati correttamente dal backup.

### 13. Gestione Appuntamenti Migliorata

#### 13.1 Creazione Appuntamento con Notifica

- **Descrizione**: Verifica che la creazione di un appuntamento con notifica WhatsApp funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Calendario"
  2. Clicca su un orario libero o sul pulsante "Nuovo Appuntamento"
  3. Seleziona un paziente
  4. Compila tutti i campi del form
  5. Attiva l'opzione "Invia notifica WhatsApp"
  6. Clicca su "Salva Appuntamento"
- **Risultato atteso**: L'appuntamento viene salvato, appare nel calendario e viene inviata una notifica WhatsApp al paziente.

#### 13.2 Eliminazione Appuntamento con Notifica

- **Descrizione**: Verifica che l'eliminazione di un appuntamento con notifica WhatsApp funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Calendario"
  2. Clicca su un appuntamento esistente
  3. Clicca su "Elimina"
  4. Conferma l'eliminazione
- **Risultato atteso**: L'appuntamento viene eliminato, non appare più nel calendario e viene inviata una notifica WhatsApp di cancellazione al paziente.

## Test Case

### 1. Setup Iniziale e Configurazione

#### 1.1 Wizard di Setup

- **Descrizione**: Verifica che il wizard di setup guidi correttamente l'utente attraverso la configurazione iniziale.
- **Passi**:
  1. Avvia l'applicazione per la prima volta
  2. Completa tutti i passaggi del wizard di setup
  3. Verifica che tutte le impostazioni vengano salvate correttamente
- **Risultato atteso**: L'applicazione si avvia con le impostazioni configurate nel wizard.

#### 1.2 Configurazione Database

- **Descrizione**: Verifica che la configurazione del database funzioni correttamente.
- **Passi**:
  1. Nel wizard di setup, inserisci i dati di connessione al database
  2. Testa la connessione
  3. Completa il setup
- **Risultato atteso**: Il database viene inizializzato correttamente con le tabelle necessarie.

#### 1.3 Configurazione Backup

- **Descrizione**: Verifica che la configurazione del backup funzioni correttamente.
- **Passi**:
  1. Nel wizard di setup, configura il percorso di backup
  2. Imposta la frequenza di backup
  3. Completa il setup
- **Risultato atteso**: Le impostazioni di backup vengono salvate correttamente.

#### 1.4 Configurazione Informazioni Generali

- **Descrizione**: Verifica che le informazioni generali dello studio medico vengano configurate correttamente.
- **Passi**:
  1. Nel wizard di setup, inserisci nome, indirizzo, email e telefono dello studio
  2. Completa il setup
- **Risultato atteso**: Le informazioni generali vengono salvate e visualizzate correttamente nell'applicazione.

### 2. Autenticazione e Gestione Utenti

#### 2.1 Login

- **Descrizione**: Verifica che il login funzioni correttamente.
- **Passi**:
  1. Apri l'applicazione
  2. Inserisci username e password
  3. Seleziona il ruolo (Medico o Assistente)
  4. Clicca su "Accedi"
- **Risultato atteso**: L'utente viene autenticato e reindirizzato alla dashboard.

#### 2.2 Logout

- **Descrizione**: Verifica che il logout funzioni correttamente.
- **Passi**:
  1. Effettua il login
  2. Clicca sul pulsante "Logout" nella sidebar
- **Risultato atteso**: L'utente viene disconnesso e reindirizzato alla pagina di login.

#### 2.3 Recupero Password

- **Descrizione**: Verifica che il recupero password funzioni correttamente.
- **Passi**:
  1. Nella pagina di login, clicca su "Password dimenticata?"
  2. Inserisci l'email
  3. Clicca su "Invia istruzioni"
- **Risultato atteso**: Viene mostrato un messaggio di conferma che le istruzioni sono state inviate.

### 3. Dashboard e Navigazione

#### 3.1 Navigazione Sidebar

- **Descrizione**: Verifica che la navigazione tramite sidebar funzioni correttamente.
- **Passi**:
  1. Effettua il login
  2. Clicca su ciascuna voce della sidebar (Dashboard, Calendario, Pazienti, Notifiche, Impostazioni)
- **Risultato atteso**: L'applicazione naviga correttamente alla pagina selezionata.

#### 3.2 Navigazione TopBar

- **Descrizione**: Verifica che la navigazione tramite barra superiore funzioni correttamente.
- **Passi**:
  1. Effettua il login
  2. Clicca su ciascuna voce della barra superiore (Dashboard, Calendario, Pazienti, Notifiche, Impostazioni)
- **Risultato atteso**: L'applicazione naviga correttamente alla pagina selezionata.

#### 3.3 Visualizzazione Dashboard

- **Descrizione**: Verifica che la dashboard mostri correttamente le informazioni riassuntive.
- **Passi**:
  1. Effettua il login
  2. Osserva la dashboard
- **Risultato atteso**: La dashboard mostra correttamente gli appuntamenti del giorno, i promemoria e le statistiche.

### 4. Gestione Pazienti

#### 4.1 Visualizzazione Lista Pazienti

- **Descrizione**: Verifica che la lista dei pazienti venga visualizzata correttamente.
- **Passi**:
  1. Vai alla pagina "Pazienti"
- **Risultato atteso**: La lista dei pazienti viene visualizzata correttamente con tutte le informazioni.

#### 4.2 Ricerca Pazienti

- **Descrizione**: Verifica che la ricerca dei pazienti funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Pazienti"
  2. Inserisci un termine di ricerca nel campo di ricerca
- **Risultato atteso**: La lista dei pazienti viene filtrata in base al termine di ricerca.

#### 4.3 Aggiunta Nuovo Paziente

- **Descrizione**: Verifica che l'aggiunta di un nuovo paziente funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Pazienti"
  2. Clicca su "Aggiungi Paziente"
  3. Compila tutti i campi del form
  4. Clicca su "Salva Paziente"
- **Risultato atteso**: Il nuovo paziente viene salvato e appare nella lista dei pazienti.

#### 4.4 Generazione Codice Fiscale

- **Descrizione**: Verifica che il codice fiscale venga generato correttamente.
- **Passi**:
  1. Vai alla pagina "Aggiungi Paziente"
  2. Compila nome, cognome, data di nascita, genere e luogo di nascita
- **Risultato atteso**: Il codice fiscale viene generato automaticamente in base ai dati inseriti.

#### 4.5 Aggiunta Nuovo Comune

- **Descrizione**: Verifica che sia possibile aggiungere un nuovo comune.
- **Passi**:
  1. Vai alla pagina "Aggiungi Paziente"
  2. Nel campo "Città di Nascita", clicca sul pulsante "+"
  3. Inserisci nome e codice catastale del nuovo comune
  4. Conferma
- **Risultato atteso**: Il nuovo comune viene aggiunto e selezionato nel campo "Città di Nascita".

#### 4.6 Modifica Paziente

- **Descrizione**: Verifica che la modifica di un paziente funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Pazienti"
  2. Trova un paziente e clicca su "Modifica"
  3. Modifica alcuni campi
  4. Clicca su "Salva Paziente"
- **Risultato atteso**: Le modifiche vengono salvate e il paziente aggiornato appare nella lista.

#### 4.7 Visualizzazione Dettagli Paziente

- **Descrizione**: Verifica che i dettagli di un paziente vengano visualizzati correttamente.
- **Passi**:
  1. Vai alla pagina "Pazienti"
  2. Trova un paziente e clicca su "Visualizza Dettagli"
- **Risultato atteso**: I dettagli del paziente vengono visualizzati correttamente con tutte le informazioni.

#### 4.8 Eliminazione Paziente

- **Descrizione**: Verifica che l'eliminazione di un paziente funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Pazienti"
  2. Trova un paziente e clicca su "Elimina"
  3. Conferma l'eliminazione
- **Risultato atteso**: Il paziente viene eliminato e non appare più nella lista.

### 5. Gestione Appuntamenti

#### 5.1 Visualizzazione Calendario

- **Descrizione**: Verifica che il calendario degli appuntamenti venga visualizzato correttamente.
- **Passi**:
  1. Vai alla pagina "Calendario"
- **Risultato atteso**: Il calendario viene visualizzato correttamente con tutti gli appuntamenti.

#### 5.2 Creazione Nuovo Appuntamento

- **Descrizione**: Verifica che la creazione di un nuovo appuntamento funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Calendario"
  2. Clicca su un orario libero o sul pulsante "Nuovo Appuntamento"
  3. Seleziona un paziente
  4. Compila tutti i campi del form
  5. Clicca su "Salva Appuntamento"
- **Risultato atteso**: Il nuovo appuntamento viene salvato e appare nel calendario.

#### 5.3 Modifica Appuntamento

- **Descrizione**: Verifica che la modifica di un appuntamento funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Calendario"
  2. Clicca su un appuntamento esistente
  3. Modifica alcuni campi
  4. Clicca su "Aggiorna Appuntamento"
- **Risultato atteso**: Le modifiche vengono salvate e l'appuntamento aggiornato appare nel calendario.

#### 5.4 Eliminazione Appuntamento

- **Descrizione**: Verifica che l'eliminazione di un appuntamento funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Calendario"
  2. Clicca su un appuntamento esistente
  3. Clicca su "Elimina"
  4. Conferma l'eliminazione
- **Risultato atteso**: L'appuntamento viene eliminato e non appare più nel calendario.

### 6. Notifiche WhatsApp

#### 6.1 Visualizzazione Centro Notifiche

- **Descrizione**: Verifica che il centro notifiche venga visualizzato correttamente.
- **Passi**:
  1. Vai alla pagina "Notifiche"
- **Risultato atteso**: Il centro notifiche viene visualizzato correttamente con tutte le notifiche.

#### 6.2 Invio Nuova Notifica

- **Descrizione**: Verifica che l'invio di una nuova notifica funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Notifiche"
  2. Clicca su "Invia Notifica"
  3. Seleziona un paziente
  4. Seleziona il tipo di notifica
  5. Inserisci il messaggio
  6. Clicca su "Invia"
- **Risultato atteso**: La notifica viene inviata e appare nell'elenco delle notifiche inviate.

#### 6.3 Reinvio Notifica

- **Descrizione**: Verifica che il reinvio di una notifica funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Notifiche"
  2. Trova una notifica e clicca sull'icona di invio
  3. Conferma il reinvio
- **Risultato atteso**: La notifica viene reinviata e lo stato viene aggiornato.

#### 6.4 Filtro Notifiche

- **Descrizione**: Verifica che il filtro delle notifiche funzioni correttamente.
- **Passi**:
  1. Vai alla pagina "Notifiche"
  2. Utilizza i filtri per stato e tipo di notifica
- **Risultato atteso**: L'elenco delle notifiche viene filtrato in base ai criteri selezionati.

### 7. Integrazione Google Calendar

#### 7.1 Configurazione Google Calendar

- **Descrizione**: Verifica che la configurazione di Google Calendar funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Integrazioni"
  2. Configura le credenziali di Google Calendar
  3. Clicca su "Connetti"
- **Risultato atteso**: L'integrazione con Google Calendar viene configurata correttamente.

#### 7.2 Sincronizzazione Appuntamenti

- **Descrizione**: Verifica che la sincronizzazione degli appuntamenti con Google Calendar funzioni correttamente.
- **Passi**:
  1. Crea un nuovo appuntamento con l'opzione "Sincronizzazione Google Calendar" attivata
  2. Salva l'appuntamento
- **Risultato atteso**: L'appuntamento viene sincronizzato con Google Calendar.

#### 7.3 Sincronizzazione Manuale

- **Descrizione**: Verifica che la sincronizzazione manuale funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Integrazioni"
  2. Clicca su "Sincronizza Ora"
- **Risultato atteso**: Tutti gli appuntamenti vengono sincronizzati con Google Calendar.

### 8. Backup e Ripristino

#### 8.1 Backup Manuale

- **Descrizione**: Verifica che il backup manuale funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Backup e Ripristino"
  2. Clicca su "Esegui Backup Manuale"
- **Risultato atteso**: Il backup viene eseguito correttamente nel percorso specificato.

#### 8.2 Ripristino da Backup

- **Descrizione**: Verifica che il ripristino da backup funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Backup e Ripristino"
  2. Clicca su "Ripristina da Backup"
  3. Seleziona un file di backup
  4. Conferma il ripristino
- **Risultato atteso**: I dati vengono ripristinati correttamente dal backup.

#### 8.3 Configurazione Backup Automatico

- **Descrizione**: Verifica che la configurazione del backup automatico funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Backup e Ripristino"
  2. Attiva "Backup Automatico"
  3. Seleziona la frequenza
  4. Specifica il percorso
  5. Salva le impostazioni
- **Risultato atteso**: Le impostazioni di backup automatico vengono salvate correttamente.

### 9. Impostazioni

#### 9.1 Impostazioni Generali

- **Descrizione**: Verifica che le impostazioni generali funzionino correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Generali"
  2. Modifica nome, indirizzo, email e telefono dello studio
  3. Clicca su "Salva Modifiche"
- **Risultato atteso**: Le impostazioni generali vengono salvate e applicate correttamente.

#### 9.2 Modalità Scura

- **Descrizione**: Verifica che la modalità scura funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Generali"
  2. Attiva "Modalità Scura"
  3. Clicca su "Salva Modifiche"
- **Risultato atteso**: L'interfaccia passa alla modalità scura.

#### 9.3 Cambio Lingua

- **Descrizione**: Verifica che il cambio lingua funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Generali"
  2. Seleziona una lingua diversa
  3. Clicca su "Salva Modifiche"
- **Risultato atteso**: L'interfaccia viene tradotta nella lingua selezionata.

#### 9.4 Impostazioni Notifiche

- **Descrizione**: Verifica che le impostazioni delle notifiche funzionino correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Notifiche"
  2. Modifica le impostazioni delle notifiche
  3. Clicca su "Salva Modifiche"
- **Risultato atteso**: Le impostazioni delle notifiche vengono salvate e applicate correttamente.

### 10. Gestione Licenze

#### 10.1 Visualizzazione Stato Licenza

- **Descrizione**: Verifica che lo stato della licenza venga visualizzato correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Licenza"
- **Risultato atteso**: Lo stato della licenza viene visualizzato correttamente con tutte le informazioni.

#### 10.2 Installazione Nuova Licenza

- **Descrizione**: Verifica che l'installazione di una nuova licenza funzioni correttamente.
- **Passi**:
  1. Vai a "Impostazioni" > "Licenza"
  2. Inserisci una nuova chiave di licenza
  3. Clicca su "Verifica e Installa"
- **Risultato atteso**: La nuova licenza viene installata e lo stato viene aggiornato.

#### 10.3 Verifica Funzionalità in Base alla Licenza

- **Descrizione**: Verifica che le funzionalità siano disponibili in base al tipo di licenza.
- **Passi**:
  1. Installa una licenza di tipo "Base"
  2. Verifica che le integrazioni con Google Calendar e WhatsApp non siano disponibili
  3. Installa una licenza di tipo "Google Calendar"
  4. Verifica che l'integrazione con Google Calendar sia disponibile
  5. Installa una licenza di tipo "WhatsApp"
  6. Verifica che l'integrazione con WhatsApp sia disponibile
  7. Installa una licenza di tipo "Completa"
  8. Verifica che tutte le integrazioni siano disponibili
- **Risultato atteso**: Le funzionalità sono disponibili in base al tipo di licenza installata.

## Esecuzione dei Test

1. Eseguire i test in ordine, partendo dal setup iniziale
2. Per ogni test, seguire i passi indicati e verificare il risultato atteso
3. Segnare eventuali discrepanze o errori
4. Documentare eventuali problemi riscontrati

## Risoluzione dei Problemi

In caso di problemi durante i test, consultare la sezione "Risoluzione dei Problemi Comuni" nella documentazione tecnica.
