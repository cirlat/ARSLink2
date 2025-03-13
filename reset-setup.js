// Script di reset semplificato che non richiede Electron
// Utile per ambienti dove Electron non è disponibile o ha problemi

const fs = require("fs");
const path = require("path");
const os = require("os");

// Percorsi comuni per i dati utente su diverse piattaforme
function getUserDataPath() {
  const appName = "patient-appointment-system";

  if (process.platform === "win32") {
    return path.join(process.env.APPDATA, appName);
  } else if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", appName);
  } else {
    return path.join(os.homedir(), ".config", appName);
  }
}

// Funzione per resettare lo stato del setup
function resetSetup() {
  const userDataPath = getUserDataPath();
  console.log(`Usando il percorso dati utente: ${userDataPath}`);

  const setupCompletedPath = path.join(userDataPath, "setup-completed");
  console.log(`Verificando il file: ${setupCompletedPath}`);

  let resetCompleted = false;

  if (fs.existsSync(setupCompletedPath)) {
    try {
      fs.unlinkSync(setupCompletedPath);
      console.log("File setup-completed eliminato.");
      resetCompleted = true;
    } catch (err) {
      console.error(
        `Errore nell'eliminazione di setup-completed: ${err.message}`,
      );
    }
  } else {
    console.log("File setup-completed non trovato. Il setup è già resettato.");
  }

  // Elimina anche altri file di configurazione
  const configFiles = ["dbConfig.json", "user.json", "license.json"];

  configFiles.forEach((file) => {
    const filePath = path.join(userDataPath, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`File ${file} eliminato.`);
        resetCompleted = true;
      } catch (err) {
        console.error(`Errore nell'eliminazione di ${file}: ${err.message}`);
      }
    } else {
      console.log(`File ${file} non trovato.`);
    }
  });

  // Elimina anche la directory config se esiste
  const configDir = path.join(userDataPath, "config");
  if (fs.existsSync(configDir)) {
    try {
      // Elimina tutti i file nella directory config
      const files = fs.readdirSync(configDir);
      files.forEach((file) => {
        const filePath = path.join(configDir, file);
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} eliminato.`);
      });

      // Elimina la directory
      fs.rmdirSync(configDir);
      console.log(`Directory ${configDir} eliminata.`);
      resetCompleted = true;
    } catch (err) {
      console.error(
        `Errore nell'eliminazione della directory config: ${err.message}`,
      );
    }
  }

  // Elimina anche i dati da localStorage (se in ambiente browser)
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem("setupCompleted");
      localStorage.removeItem("dbConfig");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("licenseKey");
      localStorage.removeItem("licenseType");
      localStorage.removeItem("licenseExpiry");
      localStorage.removeItem("googleConfig");
      localStorage.removeItem("whatsappConfig");
      localStorage.removeItem("serverConfig");
      localStorage.removeItem("backupConfig");
      localStorage.removeItem("generalSettings");
      console.log("Dati localStorage eliminati.");
      resetCompleted = true;
    } catch (err) {
      console.error(
        `Errore nell'eliminazione dei dati localStorage: ${err.message}`,
      );
    }
  }

  if (resetCompleted) {
    console.log("Reset completato con successo!");
  } else {
    console.log("Nessun file da resettare trovato.");
  }

  return resetCompleted;
}

// Esegui il reset se lo script è eseguito direttamente
if (require.main === module) {
  console.log("Avvio dello script di reset semplificato...");
  resetSetup();
  console.log("Script di reset completato.");
}

module.exports = { resetSetup };
