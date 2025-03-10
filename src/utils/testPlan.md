# Piano di Test per ARSLink2

## Istruzioni Generali

1. Esegui i test nell'ordine indicato
2. Prendi nota di eventuali errori o comportamenti inaspettati
3. Per ogni test, verifica che il comportamento sia conforme alle aspettative

## 1. Test di Autenticazione

### 1.1 Login con Utente Admin Predefinito
- [ ] Apri l'applicazione e verifica che venga mostrata la schermata di login
- [ ] Inserisci username: `admin` e password: `admin123`
- [ ] Verifica che il login avvenga con successo e che venga mostrata la dashboard

### 1.2 Logout
- [ ] Clicca sul pulsante di logout nell'header o nella sidebar
- [ ] Verifica che venga effettuato il logout e che venga mostrata la schermata di login

### 1.3 Login con Utente Creato Durante il Setup
- [ ] Se hai creato un utente durante il setup, prova a fare login con le sue credenziali
- [ ] Verifica che il login avvenga con successo

### 1.4 Password Dimenticata
- [ ] Nella schermata di login, clicca su "Password dimenticata"
- [ ] Inserisci l'email dell'utente admin
- [ ] Verifica che venga mostrato un messaggio di conferma

## 2. Test di Configurazione

### 2.1 Impostazioni Generali
- [ ] Vai in Impostazioni -> Generali
- [ ] Modifica il nome dello studio medico
- [ ] Modifica l'indirizzo, l'email e il telefono
- [ ] Attiva/disattiva la modalità scura
- [ ] Cambia la lingua
- [ ] Clicca su "Salva Modifiche"
- [ ] Verifica che le modifiche siano state salvate correttamente
- [ ] Verifica che il nome dello studio medico sia aggiornato nella sidebar

### 2.2 Backup e Ripristino
- [ ] Vai in Impostazioni -> Backup e Ripristino
- [ ] Modifica il percorso di backup usando il pulsante "Sfoglia"
- [ ] Attiva/disattiva il backup automatico
- [ ] Cambia la frequenza di backup
- [ ] Clicca su "Esegui Backup Manuale"
- [ ] Verifica che il backup venga eseguito correttamente
- [ ] Clicca su "Ripristina da Backup"
- [ ] Seleziona un file di backup (se disponibile)
- [ ] Verifica che il ripristino venga eseguito correttamente

### 2.3 Gestione Utenti
- [ ] Vai in Impostazioni -> Gestione Utenti
- [ ] Crea un nuovo utente assistente
- [ ] Verifica che l'utente venga creato correttamente
- [ ] Modifica i dati dell'utente
- [ ] Verifica che le modifiche vengano salvate correttamente
- [ ] Elimina l'utente
- [ ] Verifica che l'utente venga eliminato correttamente

## 3. Test di Gestione Pazienti

### 3.1 Creazione Nuovo Paziente
- [ ] Vai in Pazienti
- [ ] Clicca su "Aggiungi Paziente"
- [ ] Compila tutti i campi obbligatori
- [ ] Verifica che il codice fiscale venga generato automaticamente
- [ ] Aggiungi una nuova città di nascita
- [ ] Verifica che la città venga aggiunta correttamente
- [ ] Clicca su "Salva Paziente"
- [ ] Verifica che il paziente venga creato correttamente

### 3.2 Visualizzazione Dettagli Paziente
- [ ] Vai in Pazienti
- [ ] Clicca su "Visualizza Dettagli" per un paziente
- [ ] Verifica che vengano mostrati tutti i dettagli del paziente

### 3.3 Modifica Paziente
- [ ] Vai in Pazienti
- [ ] Clicca su "Modifica" per un paziente
- [ ] Modifica alcuni dati
- [ ] Clicca su "Aggiorna Paziente"
- [ ] Verifica che le modifiche vengano salvate correttamente

### 3.4 Eliminazione Paziente
- [ ] Vai in Pazienti
- [ ] Clicca su "Elimina" per un paziente
- [ ] Conferma l'eliminazione
- [ ] Verifica che il paziente venga eliminato correttamente

## 4. Test di Gestione Appuntamenti

### 4.1 Creazione Nuovo Appuntamento
- [ ] Vai in Calendario
- [ ] Clicca su "Nuovo Appuntamento"
- [ ] Seleziona un paziente
- [ ] Seleziona data e ora
- [ ] Seleziona il tipo di appuntamento
- [ ] Aggiungi eventuali note
- [ ] Clicca su "Salva Appuntamento"
- [ ] Verifica che l'appuntamento venga creato correttamente

### 4.2 Modifica Appuntamento
- [ ] Vai in Calendario
- [ ] Clicca su un appuntamento esistente
- [ ] Modifica alcuni dati
- [ ] Clicca su "Aggiorna Appuntamento"
- [ ] Verifica che le modifiche vengano salvate correttamente

### 4.3 Eliminazione Appuntamento
- [ ] Vai in Calendario
- [ ] Clicca su un appuntamento esistente
- [ ] Clicca su "Elimina"
- [ ] Conferma l'eliminazione
- [ ] Verifica che l'appuntamento venga eliminato correttamente

## 5. Test di Notifiche (con licenza appropriata)

### 5.1 Visibilità Menu Notifiche
- [ ] Verifica che il menu Notifiche sia visibile solo se la licenza include WhatsApp
- [ ] Cambia il tipo di licenza (se possibile)
- [ ] Verifica che il menu Notifiche appaia/scompaia in base al tipo di licenza

### 5.2 Creazione Nuova Notifica
- [ ] Vai in Notifiche
- [ ] Clicca su "Nuova Notifica"
- [ ] Seleziona un paziente
- [ ] Seleziona il tipo di notifica
- [ ] Inserisci un messaggio
- [ ] Seleziona data e ora (opzionale)
- [ ] Clicca su "Salva Notifica"
- [ ] Ver