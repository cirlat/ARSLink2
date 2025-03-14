/**
 * Script di reset semplificato che non richiede Electron
 * Può essere eseguito direttamente con Node.js
 */

const fs = require("fs");
const path = require("path");

// Funzione per log con timestamp
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Determina il percorso dei dati utente in base al sistema operativo
function getUserDataPath() {
  let userDataPath;
  if (process.platform === "win32") {
    userDataPath = path.join(
      process.env.APPDATA || "",
      "PatientAppointmentSystem",
    );
    // Controlla anche LocalAppData
    const localAppDataPath = path.join(
      process.env.LOCALAPPDATA || "",
      "PatientAppointmentSystem",
    );
    if (fs.existsSync(localAppDataPath)) {
      logWithTimestamp(
        `Trovata anche directory in LocalAppData: ${localAppDataPath}`,
      );
    }
  } else if (process.platform === "darwin") {
    userDataPath = path.join(
      process.env.HOME || "",
      "Library",
      "Application Support",
      "PatientAppointmentSystem",
    );
    // Controlla anche la directory Cache
    const cachePath = path.join(
      process.env.HOME || "",
      "Library",
      "Caches",
      "PatientAppointmentSystem",
    );
    if (fs.existsSync(cachePath)) {
      logWithTimestamp(`Trovata anche directory cache: ${cachePath}`);
    }
  } else {
    userDataPath = path.join(
      process.env.HOME || "",
      ".config",
      "PatientAppointmentSystem",
    );
    // Controlla anche la directory cache
    const cachePath = path.join(
      process.env.HOME || "",
      ".cache",
      "PatientAppointmentSystem",
    );
    if (fs.existsSync(cachePath)) {
      logWithTimestamp(`Trovata anche directory cache: ${cachePath}`);
    }
  }
  return userDataPath;
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
        logWithTimestamp(`File eliminato: ${curPath}`);
      }
    });
    // Elimina la directory vuota
    fs.rmdirSync(dirPath);
    logWithTimestamp(`Directory eliminata: ${dirPath}`);
  }
}

// Funzione principale di reset
function resetSetup() {
  try {
    const userDataPath = getUserDataPath();
    logWithTimestamp(`Percorso dati utente: ${userDataPath}`);

    // Verifica se la directory esiste
    if (!fs.existsSync(userDataPath)) {
      logWithTimestamp(`La directory ${userDataPath} non esiste.`);
      return false;
    }

    let resetPerformed = false;

    // Cerca e elimina il file setup-completed
    const setupCompletedPath = path.join(userDataPath, "setup-completed");
    if (fs.existsSync(setupCompletedPath)) {
      fs.unlinkSync(setupCompletedPath);
      logWithTimestamp(`File setup-completed eliminato.`);
      resetPerformed = true;
    } else {
      logWithTimestamp(`File setup-completed non trovato.`);

      // Cerca file alternativi
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
      }
    });

    // Pulisci le directory di cache
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
          deleteDirectory(dirPath);
          resetPerformed = true;
        } catch (error) {
          logWithTimestamp(
            `Errore nell'eliminazione della directory ${dir}: ${error.message}`,
          );
        }
      }
    });

    // Controlla anche in LocalAppData su Windows
    if (process.platform === "win32" && process.env.LOCALAPPDATA) {
      const localAppDataPath = path.join(
        process.env.LOCALAPPDATA,
        "PatientAppointmentSystem",
      );
      if (fs.existsSync(localAppDataPath)) {
        logWithTimestamp(
          `Pulizia della directory in LocalAppData: ${localAppDataPath}`,
        );
        try {
          const localCacheDirs = ["Cache", "GPUCache", "Code Cache"];
          localCacheDirs.forEach((dir) => {
            const dirPath = path.join(localAppDataPath, dir);
            if (fs.existsSync(dirPath)) {
              deleteDirectory(dirPath);
              resetPerformed = true;
            }
          });
        } catch (error) {
          logWithTimestamp(
            `Errore nella pulizia di LocalAppData: ${error.message}`,
          );
        }
      }
    }

    // Controlla localStorage nel browser (solo informativo)
    logWithTimestamp(
      "NOTA: Questo script non può pulire localStorage del browser.",
    );
    logWithTimestamp(
      "Per pulire localStorage, apri gli strumenti di sviluppo (F12) nell'app,",
    );
    logWithTimestamp(
      "vai alla scheda Application > Storage > Local Storage e clicca su Clear.",
    );

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

// Esegui il reset
logWithTimestamp("Avvio dello script di reset console...");
const result = resetSetup();
logWithTimestamp(`Reset completato con risultato: ${result}`);
