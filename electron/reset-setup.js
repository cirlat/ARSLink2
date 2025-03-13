const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// Funzione per resettare lo stato del setup
function resetSetup() {
  const userDataPath = app.getPath("userData");
  const setupCompletedPath = path.join(userDataPath, "setup-completed");

  console.log(`Verificando il file: ${setupCompletedPath}`);

  if (fs.existsSync(setupCompletedPath)) {
    fs.unlinkSync(setupCompletedPath);
    console.log("Setup reset completato!");

    // Opzionalmente, puoi anche eliminare altri file di configurazione
    const configFiles = ["dbConfig.json", "user.json", "license.json"];

    configFiles.forEach((file) => {
      const filePath = path.join(userDataPath, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${file} eliminato.`);
      }
    });

    return true;
  } else {
    console.log("File setup-completed non trovato. Il setup è già resettato.");
    return false;
  }
}

// Se eseguito direttamente
if (require.main === module) {
  console.log("Avvio dello script di reset...");

  // Inizializza l'app Electron senza aprire finestre
  app
    .whenReady()
    .then(() => {
      console.log("Electron app pronta, esecuzione reset...");
      const result = resetSetup();
      console.log("Reset completato con risultato:", result);
      console.log("Chiusura dell'applicazione...");
      app.exit(0); // Forza l'uscita con codice 0 (successo)
    })
    .catch((err) => {
      console.error("Errore durante l'inizializzazione di Electron:", err);
      process.exit(1); // Esce con codice di errore
    });

  // Aggiungi un timeout di sicurezza
  setTimeout(() => {
    console.log("Timeout di sicurezza raggiunto, uscita forzata.");
    process.exit(0);
  }, 5000); // 5 secondi
}

module.exports = { resetSetup };
