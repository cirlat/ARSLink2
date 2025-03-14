const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// Flags per modalità verbose e console-only
const args = process.argv.slice(2);
const isVerbose = args.includes("--verbose");
const isConsoleOnly = args.includes("--console-only");

// Funzione per log con timestamp
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Funzione per resettare lo stato del setup
function resetSetup() {
  // Se in modalità console-only, non usiamo Electron
  if (isConsoleOnly) {
    try {
      // Determina il percorso dei dati utente manualmente
      let userDataPath;
      if (process.platform === "win32") {
        userDataPath = path.join(
          process.env.APPDATA || "",
          "PatientAppointmentSystem",
        );
      } else if (process.platform === "darwin") {
        userDataPath = path.join(
          process.env.HOME || "",
          "Library",
          "Application Support",
          "PatientAppointmentSystem",
        );
      } else {
        userDataPath = path.join(
          process.env.HOME || "",
          ".config",
          "PatientAppointmentSystem",
        );
      }

      logWithTimestamp(
        `Modalità console-only. Percorso dati utente: ${userDataPath}`,
      );
      return resetFilesInPath(userDataPath);
    } catch (error) {
      logWithTimestamp(`Errore in modalità console-only: ${error.message}`);
      return false;
    }
  }

  try {
    const userDataPath = app.getPath("userData");
    logWithTimestamp(`Percorso dati utente: ${userDataPath}`);
    return resetFilesInPath(userDataPath);
  } catch (error) {
    logWithTimestamp(
      `Errore nel recupero del percorso dati utente: ${error.message}`,
    );
    return false;
  }
}

// Funzione per resettare i file in un percorso specifico
function resetFilesInPath(userDataPath) {
  try {
    // Verifica se la directory esiste
    if (!fs.existsSync(userDataPath)) {
      logWithTimestamp(`La directory ${userDataPath} non esiste.`);
      return false;
    }

    // Cerca il file setup-completed
    const setupCompletedPath = path.join(userDataPath, "setup-completed");
    logWithTimestamp(`Verificando il file: ${setupCompletedPath}`);

    let resetPerformed = false;

    // Elimina il file setup-completed se esiste
    if (fs.existsSync(setupCompletedPath)) {
      fs.unlinkSync(setupCompletedPath);
      logWithTimestamp(`File setup-completed eliminato.`);
      resetPerformed = true;
    } else {
      logWithTimestamp(`File setup-completed non trovato.`);

      // Cerca file alternativi che potrebbero indicare il completamento del setup
      const alternativeFiles = [
        "setup.json",
        "config.json",
        "initialized",
        "setup-status.json",
      ];
      alternativeFiles.forEach((file) => {
        const altPath = path.join(userDataPath, file);
        if (fs.existsSync(altPath)) {
          fs.unlinkSync(altPath);
          logWithTimestamp(`File alternativo ${file} trovato ed eliminato.`);
          resetPerformed = true;
        }
      });
    }

    // Elimina i file di configurazione
    const configFiles = [
      "dbConfig.json",
      "user.json",
      "license.json",
      "settings.json",
    ];
    configFiles.forEach((file) => {
      const filePath = path.join(userDataPath, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logWithTimestamp(`File ${file} eliminato.`);
        resetPerformed = true;
      } else {
        logWithTimestamp(`File ${file} non trovato.`);
      }
    });

    // Pulisci le directory di cache se esistono
    const cacheDirs = [
      "Cache",
      "Local Storage",
      "Session Storage",
      "IndexedDB",
    ];
    cacheDirs.forEach((dir) => {
      const dirPath = path.join(userDataPath, dir);
      if (fs.existsSync(dirPath)) {
        try {
          // Elimina ricorsivamente la directory
          deleteDirectory(dirPath);
          logWithTimestamp(`Directory ${dir} eliminata.`);
          resetPerformed = true;
        } catch (error) {
          logWithTimestamp(
            `Errore nell'eliminazione della directory ${dir}: ${error.message}`,
          );
        }
      } else {
        logWithTimestamp(`Directory ${dir} non trovata.`);
      }
    });

    // Controlla anche in LocalAppData su Windows
    if (process.platform === "win32") {
      try {
        const localAppDataPath = process.env.LOCALAPPDATA;
        if (localAppDataPath) {
          const appLocalDataPath = path.join(
            localAppDataPath,
            "PatientAppointmentSystem",
          );
          if (fs.existsSync(appLocalDataPath)) {
            logWithTimestamp(
              `Trovata directory in LocalAppData: ${appLocalDataPath}`,
            );
            // Pulisci anche questa directory
            const localCacheDirs = ["Cache", "GPUCache", "Code Cache"];
            localCacheDirs.forEach((dir) => {
              const dirPath = path.join(appLocalDataPath, dir);
              if (fs.existsSync(dirPath)) {
                try {
                  deleteDirectory(dirPath);
                  logWithTimestamp(
                    `Directory ${dir} in LocalAppData eliminata.`,
                  );
                  resetPerformed = true;
                } catch (error) {
                  logWithTimestamp(
                    `Errore nell'eliminazione della directory ${dir} in LocalAppData: ${error.message}`,
                  );
                }
              }
            });
          }
        }
      } catch (error) {
        logWithTimestamp(
          `Errore nell'accesso a LocalAppData: ${error.message}`,
        );
      }
    }

    if (resetPerformed) {
      logWithTimestamp("Reset completato con successo!");
      return true;
    } else {
      logWithTimestamp(
        "Nessun file da resettare trovato. Verifica il percorso o i permessi.",
      );
      return false;
    }
  } catch (error) {
    logWithTimestamp(`Errore durante il reset: ${error.message}`);
    return false;
  }
}

// Funzione per eliminare ricorsivamente una directory
function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Ricorsione per le sottodirectory
        deleteDirectory(curPath);
      } else {
        // Elimina i file
        fs.unlinkSync(curPath);
        if (isVerbose) logWithTimestamp(`File eliminato: ${curPath}`);
      }
    });
    // Elimina la directory vuota
    fs.rmdirSync(dirPath);
  }
}

// Se eseguito direttamente
if (require.main === module) {
  logWithTimestamp("Avvio dello script di reset...");

  if (isConsoleOnly) {
    logWithTimestamp(
      "Modalità console-only attivata. Non verrà utilizzato Electron.",
    );
    const result = resetSetup();
    logWithTimestamp(`Reset completato con risultato: ${result}`);
    process.exit(result ? 0 : 1);
  } else {
    // Inizializza l'app Electron senza aprire finestre
    logWithTimestamp("Inizializzazione dell'app Electron...");

    // Mostra informazioni di debug se in modalità verbose
    if (isVerbose) {
      logWithTimestamp(`Versione Electron: ${process.versions.electron}`);
      logWithTimestamp(`Versione Node: ${process.versions.node}`);
      logWithTimestamp(`Piattaforma: ${process.platform}`);
      logWithTimestamp(`Architettura: ${process.arch}`);
      logWithTimestamp(`Directory corrente: ${process.cwd()}`);
      logWithTimestamp(`Argomenti: ${process.argv.join(", ")}`);
    }

    app
      .whenReady()
      .then(() => {
        logWithTimestamp("Electron app pronta, esecuzione reset...");
        const result = resetSetup();
        logWithTimestamp(`Reset completato con risultato: ${result}`);
        logWithTimestamp("Chiusura dell'applicazione...");
        app.exit(0); // Forza l'uscita con codice 0 (successo)
      })
      .catch((err) => {
        logWithTimestamp(
          `Errore durante l'inizializzazione di Electron: ${err.message}`,
        );
        process.exit(1); // Esce con codice di errore
      });

    // Aggiungi un timeout di sicurezza
    setTimeout(() => {
      logWithTimestamp("Timeout di sicurezza raggiunto, uscita forzata.");
      process.exit(0);
    }, 10000); // 10 secondi
  }
}

module.exports = { resetSetup };
