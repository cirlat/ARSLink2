const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { Client } = require("pg");
const { exec } = require("child_process");

// Define __dirname for CommonJS
const __dirname = path.dirname(require.main.filename);

// Gestione del database PostgreSQL reale
let dbClient = null;

// Crea la finestra principale
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // In produzione, carica l'app compilata
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    // In sviluppo, carica dal server di sviluppo
    mainWindow.loadURL("http://localhost:5173");
    // Apri DevTools in sviluppo
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Gestione delle comunicazioni IPC
ipcMain.handle("connect-database", async (event, config) => {
  try {
    // Chiudi la connessione esistente se presente
    if (dbClient) {
      await dbClient.end();
    }

    // Crea una nuova connessione
    dbClient = new Client({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.dbName,
    });

    await dbClient.connect();
    return { success: true, message: "Connessione al database stabilita" };
  } catch (error) {
    console.error("Errore di connessione al database:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("execute-query", async (event, { query, params }) => {
  try {
    if (!dbClient) {
      throw new Error("Database non connesso");
    }
    const result = await dbClient.query(query, params);
    return { success: true, rows: result.rows };
  } catch (error) {
    console.error("Errore nell'esecuzione della query:", error);
    return { success: false, error: error.message };
  }
});

// Gestione backup e ripristino
ipcMain.handle("backup-database", async (event, backupPath) => {
  try {
    // Ottieni la configurazione del database
    if (!dbClient) {
      throw new Error("Database non connesso");
    }

    const config = dbClient.connectionParameters;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${config.database}_backup_${timestamp}.sql`;
    const fullPath = path.join(backupPath, filename);

    // Assicurati che la directory esista
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Comando pg_dump
    const command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.user} -F c -b -v -f "${fullPath}" ${config.database}`;

    return new Promise((resolve, reject) => {
      // Imposta la variabile d'ambiente PGPASSWORD per evitare la richiesta di password
      const env = { ...process.env, PGPASSWORD: config.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Errore nell'esecuzione di pg_dump: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          resolve({ success: false, error: error.message });
          return;
        }

        console.log(`Backup completato: ${fullPath}`);
        console.log(`stdout: ${stdout}`);
        resolve({ success: true, path: fullPath });
      });
    });
  } catch (error) {
    console.error("Errore durante il backup del database:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("restore-database", async (event, restorePath) => {
  try {
    // Ottieni la configurazione del database
    if (!dbClient) {
      throw new Error("Database non connesso");
    }

    const config = dbClient.connectionParameters;

    // Comando pg_restore
    const command = `pg_restore -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -c -v "${restorePath}"`;

    return new Promise((resolve, reject) => {
      // Imposta la variabile d'ambiente PGPASSWORD per evitare la richiesta di password
      const env = { ...process.env, PGPASSWORD: config.password };

      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(
            `Errore nell'esecuzione di pg_restore: ${error.message}`,
          );
          console.error(`stderr: ${stderr}`);
          resolve({ success: false, error: error.message });
          return;
        }

        console.log(`Ripristino completato da: ${restorePath}`);
        console.log(`stdout: ${stdout}`);
        resolve({ success: true });
      });
    });
  } catch (error) {
    console.error("Errore durante il ripristino del database:", error);
    return { success: false, error: error.message };
  }
});