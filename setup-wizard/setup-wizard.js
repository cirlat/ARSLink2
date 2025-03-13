/**
 * Setup Wizard per Sistema Gestione Appuntamenti
 * Applicazione standalone per la configurazione iniziale del sistema
 */

// Elementi DOM
const setupContainer = document.getElementById("setup-container");

// Stato dell'applicazione
let currentStep = 1;
let totalSteps = 8;
let progress = 0;

// Configurazioni
let dbConfig = {
  host: "localhost",
  port: "5432",
  username: "postgres",
  password: "",
  dbName: "patient_appointment_system",
};

let adminUser = {
  username: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  email: "",
};

let licenseType = "basic";
let licenseKey = "";
let detectedLicenseType = null;

// Chiave segreta per la generazione e verifica delle licenze
const LICENSE_SECRET = "ARSLink2-SecretKey-2024";

/**
 * Verifica la validità di una chiave di licenza
 * @param licenseKey Chiave di licenza da verificare
 * @returns Oggetto con informazioni sulla validità della licenza
 */
function verifyLicenseKeyInternal(licenseKey) {
  try {
    // Verifica il formato della licenza
    const parts = licenseKey.split("-");
    if (parts.length < 4) {
      return { valid: false, error: "Formato licenza non valido" };
    }

    // Estrai le parti della licenza
    const type = parts[0].toLowerCase();
    const expiryCode = parts[2];
    const providedChecksum = parts[3];

    // Ricostruisci la base della licenza per verificare il checksum
    const licenseBase = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const expectedChecksum = generateChecksum(licenseBase + LICENSE_SECRET);

    // Verifica il checksum
    if (providedChecksum !== expectedChecksum) {
      return { valid: false, error: "Checksum non valido" };
    }

    // Verifica il tipo di licenza
    if (!["basic", "google", "whatsapp", "full"].includes(type)) {
      return { valid: false, error: "Tipo di licenza non valido" };
    }

    // Decodifica la data di scadenza
    const expiryTimestamp = parseInt(expiryCode, 36);
    const expiryDate = new Date(expiryTimestamp);

    // Verifica se la licenza è scaduta
    if (expiryDate < new Date()) {
      return {
        valid: false,
        licenseType: type,
        expiryDate,
        error: "Licenza scaduta",
      };
    }

    // Licenza valida
    return {
      valid: true,
      licenseType: type,
      expiryDate,
    };
  } catch (error) {
    return { valid: false, error: "Errore durante la verifica della licenza" };
  }
}

/**
 * Genera un checksum semplice per la verifica della licenza
 * @param input Stringa di input
 * @returns Checksum generato
 */
function generateChecksum(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Converti in integer a 32 bit
  }

  // Converti in stringa esadecimale e prendi gli ultimi 8 caratteri
  return Math.abs(hash)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")
    .substring(0, 8);
}

let googleConfig = {
  clientId: "",
  clientSecret: "",
  redirectUri: "http://localhost:3000/auth/google/callback",
};

let whatsappConfig = {
  enabled: false,
  browserPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  dataPath: "C:\\ProgramData\\PatientAppointmentSystem\\WhatsApp",
};

let serverConfig = {
  port: "3000",
  autoStart: true,
  startWithWindows: true,
};

let backupConfig = {
  backupPath: "C:\\ProgramData\\PatientAppointmentSystem\\Backups",
  autoBackup: true,
  backupFrequency: "daily",
};

let generalSettings = {
  clinicName: "Studio Medico Dr. Rossi",
  address: "Via Roma 123, 00100 Roma",
  email: "info@studiomedico.it",
  phone: "+39 06 12345678",
  darkMode: false,
  language: "it",
};

// Stato UI
let showPassword = false;
let isDbLoading = false;
let dbConnectionStatus = {
  status: "idle",
  message: "",
};
let connectionLogs = [];

// Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
  renderStep(currentStep);
});

// Funzioni di rendering
function renderStep(step) {
  setupContainer.innerHTML = "";

  // Barra di progresso
  const progressBar = document.createElement("div");
  progressBar.className = "mb-6";
  progressBar.innerHTML = `
    <div class="flex justify-between mb-2">
      <span class="text-sm font-medium">Passo ${currentStep} di ${totalSteps}</span>
      <span class="text-sm text-gray-500">${Math.round(progress)}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div class="bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div>
    </div>
  `;
  setupContainer.appendChild(progressBar);

  // Contenuto del passo
  const stepContent = document.createElement("div");
  stepContent.className = "space-y-6";

  switch (step) {
    case 1:
      stepContent.innerHTML = renderDatabaseStep();
      break;
    case 2:
      stepContent.innerHTML = renderAdminUserStep();
      break;
    case 3:
      stepContent.innerHTML = renderLicenseStep();
      break;
    case 4:
      stepContent.innerHTML = renderGoogleCalendarStep();
      break;
    case 5:
      stepContent.innerHTML = renderWhatsAppStep();
      break;
    case 6:
      stepContent.innerHTML = renderServerStep();
      break;
    case 7:
      stepContent.innerHTML = renderBackupStep();
      break;
    case 8:
      stepContent.innerHTML = renderGeneralSettingsStep();
      break;
    default:
      stepContent.innerHTML = "<p>Passo non valido</p>";
  }

  setupContainer.appendChild(stepContent);

  // Pulsanti di navigazione
  const navigation = document.createElement("div");
  navigation.className = "flex justify-between mt-6";
  navigation.innerHTML = `
    <button id="prev-button" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center ${currentStep === 1 ? "opacity-50 cursor-not-allowed" : ""}">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Indietro
    </button>
    <button id="next-button" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
      ${currentStep === totalSteps ? "Completa Setup" : "Avanti"}
      ${currentStep !== totalSteps ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>' : ""}
    </button>
  `;
  setupContainer.appendChild(navigation);

  // Aggiungi event listeners
  document.getElementById("prev-button").addEventListener("click", prevStep);
  document.getElementById("next-button").addEventListener("click", nextStep);

  // Aggiungi event listeners specifici per ogni passo
  if (step === 1) {
    document
      .getElementById("test-connection-button")
      ?.addEventListener("click", testConnection);
    document.getElementById("db-password")?.addEventListener("input", (e) => {
      dbConfig.password = e.target.value;
    });
    document
      .getElementById("toggle-password")
      ?.addEventListener("click", togglePasswordVisibility);
  }

  if (step === 2) {
    document
      .getElementById("admin-password")
      ?.addEventListener("input", (e) => {
        adminUser.password = e.target.value;
      });
    document
      .getElementById("admin-confirm-password")
      ?.addEventListener("input", (e) => {
        adminUser.confirmPassword = e.target.value;
      });
    document
      .getElementById("toggle-password")
      ?.addEventListener("click", togglePasswordVisibility);
  }

  if (step === 3) {
    document
      .getElementById("verify-license-button")
      ?.addEventListener("click", verifyLicense);
  }
}

function renderDatabaseStep() {
  return `
    <h2 class="text-xl font-semibold flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
      Configurazione Database
    </h2>
    <p class="text-gray-600 mb-4">Configura la connessione al database PostgreSQL</p>
    
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Host</label>
        <input id="db-host" type="text" value="${dbConfig.host}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          onchange="dbConfig.host = this.value" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Porta</label>
        <input id="db-port" type="text" value="${dbConfig.port}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          onchange="dbConfig.port = this.value" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Nome Utente</label>
        <input id="db-username" type="text" value="${dbConfig.username}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          onchange="dbConfig.username = this.value" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Password</label>
        <div class="relative">
          <input id="db-password" type="${showPassword ? "text" : "password"}" value="${dbConfig.password}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          <button id="toggle-password" type="button" class="absolute right-0 top-0 h-full px-3">
            ${
              showPassword
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
            }
          </button>
        </div>
        <p class="text-xs text-gray-500">Campo obbligatorio per la connessione al database</p>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Nome Database</label>
        <input id="db-name" type="text" value="${dbConfig.dbName}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          onchange="dbConfig.dbName = this.value" />
        <p class="text-xs text-gray-500">Il database verrà creato automaticamente se non esiste</p>
      </div>

      ${
        dbConnectionStatus.status !== "idle"
          ? `
        <div class="p-3 rounded-md ${dbConnectionStatus.status === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}">
          ${dbConnectionStatus.message}
        </div>
      `
          : ""
      }

      ${
        connectionLogs.length > 0
          ? `
        <div class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <h4 class="text-sm font-medium mb-2">Log di connessione:</h4>
          <div class="max-h-40 overflow-y-auto text-xs font-mono">
            ${connectionLogs.map((log) => `<div class="py-1 border-b border-gray-100 last:border-0">${log}</div>`).join("")}
          </div>
        </div>
      `
          : ""
      }

      <div class="flex justify-between pt-4">
        <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center" 
          onclick="window.open('https://www.postgresql.org/download/', '_blank')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Scarica PostgreSQL
        </button>
        <button id="test-connection-button" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center" ${isDbLoading ? "disabled" : ""}>
          ${
            isDbLoading
              ? '<div class="spinner mr-2"></div>Connessione in corso...'
              : '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>Testa Connessione'
          }
        </button>
      </div>
    </div>
  `;
}

function renderAdminUserStep() {
  return `
    <h2 class="text-xl font-semibold flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      Creazione Utente Amministratore
    </h2>
    <p class="text-gray-600 mb-4">Crea l'utente amministratore principale per il sistema</p>
    
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Nome Completo</label>
        <input id="admin-fullname" type="text" value="${adminUser.fullName}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          onchange="adminUser.fullName = this.value" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Email</label>
        <input id="admin-email" type="email" value="${adminUser.email}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          onchange="adminUser.email = this.value" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Nome Utente</label>
        <input id="admin-username" type="text" value="${adminUser.username}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          onchange="adminUser.username = this.value" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Password</label>
        <div class="relative">
          <input id="admin-password" type="${showPassword ? "text" : "password"}" value="${adminUser.password}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          <button id="toggle-password" type="button" class="absolute right-0 top-0 h-full px-3">
            ${
              showPassword
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
            }
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Conferma Password</label>
        <div class="relative">
          <input id="admin-confirm-password" type="${showPassword ? "text" : "password"}" value="${adminUser.confirmPassword}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
    </div>
  `;
}

function renderLicenseStep() {
  return `
    <h2 class="text-xl font-semibold flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
      Installazione Licenza
    </h2>
    <p class="text-gray-600 mb-4">Seleziona il tipo di licenza e inserisci la chiave</p>
    
    <div class="space-y-6">
      <div class="space-y-4">
        <div class="bg-gray-100 p-4 rounded-md">
          <h3 class="text-sm font-medium mb-2">Tipi di Licenza Disponibili</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-center">
              <span class="inline-block w-3 h-3 bg-gray-200 rounded-full mr-2"></span>
              <strong>Base:</strong> Funzionalità di base senza integrazioni
            </li>
            <li class="flex items-center">
              <span class="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2"></span>
              <strong>Google Calendar:</strong> Include sincronizzazione con Google Calendar
            </li>
            <li class="flex items-center">
              <span class="inline-block w-3 h-3 bg-green-200 rounded-full mr-2"></span>
              <strong>WhatsApp:</strong> Include notifiche WhatsApp
            </li>
            <li class="flex items-center">
              <span class="inline-block w-3 h-3 bg-purple-200 rounded-full mr-2"></span>
              <strong>Completa:</strong> Include tutte le funzionalità
            </li>
          </ul>
          <p class="mt-2 text-xs text-gray-500">
            Il tipo di licenza sarà determinato automaticamente dalla chiave inserita.
          </p>
        </div>
      </div>

      <hr class="border-gray-200" />

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Chiave di Licenza</label>
        <input id="license-key" type="text" value="${licenseKey}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          placeholder="XXXX-XXXX-XXXX-XXXX" onchange="licenseKey = this.value" />
        <p class="text-sm text-gray-500">La licenza ha validità di 1 anno dalla data di attivazione</p>
      </div>

      <button id="verify-license-button" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Verifica Licenza
      </button>
    </div>
  `;
}

function renderGoogleCalendarStep() {
  const isLicenseWithGoogle =
    detectedLicenseType === "google" || detectedLicenseType === "full";

  return `
    <h2 class="text-xl font-semibold flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Configurazione Google Calendar
    </h2>
    <p class="text-gray-600 mb-4">
      ${
        isLicenseWithGoogle
          ? "Configura l'integrazione con Google Calendar"
          : "Questa funzionalità non è disponibile con la licenza selezionata"
      }
    </p>
    
    ${
      isLicenseWithGoogle
        ? `
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Client ID</label>
          <input type="text" value="${googleConfig.clientId}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            onchange="googleConfig.clientId = this.value" />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Client Secret</label>
          <input type="password" value="${googleConfig.clientSecret}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            onchange="googleConfig.clientSecret = this.value" />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">URI di Reindirizzamento</label>
          <input type="text" value="${googleConfig.redirectUri}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            onchange="googleConfig.redirectUri = this.value" />
        </div>

        <div class="pt-4 space-y-2">
          <p class="text-sm text-gray-500">Per ottenere le credenziali Google Calendar:</p>
          <ol class="list-decimal list-inside text-sm text-gray-500 space-y-1">
            <li>Vai alla Console Google Cloud</li>
            <li>Crea un nuovo progetto</li>
            <li>Abilita l'API Google Calendar</li>
            <li>Configura la schermata di consenso OAuth</li>
            <li>Crea credenziali OAuth 2.0</li>
          </ol>
          <button class="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
            onclick="window.open('https://console.cloud.google.com/apis/credentials', '_blank')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Vai alla Console Google Cloud
          </button>
        </div>
      </div>
    `
        : `
      <div class="p-6 text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>L'integrazione con Google Calendar non è disponibile con la licenza attuale.</p>
        <p class="text-sm mt-2">Aggiorna la tua licenza per sbloccare questa funzionalità.</p>
      </div>
    `
    }
  `;
}

function renderWhatsAppStep() {
  const isLicenseWithWhatsApp =
    detectedLicenseType === "whatsapp" || detectedLicenseType === "full";

  return `
    <h2 class="text-xl font-semibold flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      Configurazione WhatsApp
    </h2>
    <p class="text-gray-600 mb-4">
      ${
        isLicenseWithWhatsApp
          ? "Configura l'integrazione con WhatsApp per le notifiche"
          : "Questa funzionalità non è disponibile con la licenza selezionata"
      }
    </p>
    
    ${
      isLicenseWithWhatsApp
        ? `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <label class="block text-sm font-medium text-gray-700">Abilita WhatsApp</label>
            <p class="text-sm text-gray-500">Attiva l'integrazione con WhatsApp per le notifiche</p>
          </div>
          <div class="relative inline-block w-10 mr-2 align-middle select-none">
            <input type="checkbox" id="whatsapp-toggle" ${whatsappConfig.enabled ? "checked" : ""} class="sr-only" 
              onchange="whatsappConfig.enabled = this.checked; renderStep(currentStep);" />
            <label for="whatsapp-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${whatsappConfig.enabled ? "bg-blue-500" : ""}">
              <span class="block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${whatsappConfig.enabled ? "translate-x-4" : ""}"></span>
            </label>
          </div>
        </div>

        ${
          whatsappConfig.enabled
            ? `
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Percorso Browser</label>
            <input type="text" value="${whatsappConfig.browserPath}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
              placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe" 
              onchange="whatsappConfig.browserPath = this.value" />
            <p class="text-xs text-gray-500">Percorso completo dell'eseguibile del browser Chrome</p>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Percorso Dati</label>
            <input type="text" value="${whatsappConfig.dataPath}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
              placeholder="C:\ProgramData\PatientAppointmentSystem\WhatsApp" 
              onchange="whatsappConfig.dataPath = this.value" />
            <p class="text-xs text-gray-500">Cartella dove salvare i dati della sessione WhatsApp</p>
          </div>

          <div class="pt-4 space-y-2">
            <p class="text-sm text-gray-500">Note sull'integrazione WhatsApp:</p>
            <ul class="list-disc list-inside text-sm text-gray-500 space-y-1">
              <li>Richiede Chrome installato sul sistema</li>
              <li>Utilizza Selenium per automatizzare WhatsApp Web</li>
              <li>Necessita di scansione QR code al primo avvio</li>
              <li>Non invia messaggi a numeri non salvati</li>
            </ul>
          </div>
        `
            : ""
        }
      </div>
    `
        : `
      <div class="p-6 text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>L'integrazione con WhatsApp non è disponibile con la licenza attuale.</p>
        <p class="text-sm mt-2">Aggiorna la tua licenza per sbloccare questa funzionalità.</p>
      </div>
    `
    }
  `;
}

function renderServerStep() {
  return `
    <h2 class="text-xl font-semibold flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
      Configurazione Server
    </h2>
    <p class="text-gray-600 mb-4">Configura le impostazioni del server dell'applicazione</p>
    
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Porta Server</label>
        <input type="text" value="${serverConfig.port}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          placeholder="3000" onchange="serverConfig.port = this.value" />
        <p class="text-xs text-gray-500">Porta su cui il server dell'applicazione sarà in ascolto</p>
      </div>

      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <label class="block text-sm font-medium text-gray-700">Avvio Automatico</label>
          <p class="text-sm text-gray-500">Avvia automaticamente il server all'apertura dell'applicazione</p>
        </div>
        <div class="relative inline-block w-10 mr-2 align-middle select-none">
          <input type="checkbox" id="auto-start-toggle" ${serverConfig.autoStart ? "checked" : ""} class="sr-only" 
            onchange="serverConfig.autoStart = this.checked" />
          <label for="auto-start-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${serverConfig.autoStart ? "bg-blue-500" : ""}">
            <span class="block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${serverConfig.autoStart ? "translate-x-4" : ""}"></span>
          </label>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <label class="block text-sm font-medium text-gray-700">Avvio con Windows</label>
          <p class="text-sm text-gray-500">Avvia l'applicazione all'avvio di Windows</p>
        </div>
        <div class="relative inline-block w-10 mr-2 align-middle select-none">
          <input type="checkbox" id="start-with-windows-toggle" ${serverConfig.startWithWindows ? "checked" : ""} class="sr-only" 
            onchange="serverConfig.startWithWindows = this.checked" />
          <label for="start-with-windows-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${serverConfig.startWithWindows ? "bg-blue-500" : ""}">
            <span class="block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${serverConfig.startWithWindows ? "translate-x-4" : ""}"></span>
          </label>
        </div>
      </div>
    </div>
  `;
}

function renderBackupStep() {
  return `
    <h2 class="text-xl font-semibold flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
      Configurazione Backup
    </h2>
    <p class="text-gray-600 mb-4">Configura le impostazioni di backup automatico</p>
    
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Percorso Backup</label>
        <input type="text" value="${backupConfig.backupPath}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          placeholder="C:\\ProgramData\\PatientAppointmentSystem\\Backups" 
          onchange="backupConfig.backupPath = this.value" />
        <p class="text-xs text-gray-500">Cartella dove salvare i backup del database</p>
      </div>

      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <label class="block text-sm font-medium text-gray-700">Backup Automatico</label>
          <p class="text-sm text-gray-500">Esegui backup automatici del database</p>
        </div>
        <div class="relative inline-block w-10 mr-2 align-middle select-none">
          <input type="checkbox" id="auto-backup-toggle" ${backupConfig.autoBackup ? "checked" : ""} class="sr-only" 
            onchange="backupConfig.autoBackup = this.checked; renderStep(currentStep);" />
          <label for="auto-backup-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${backupConfig.autoBackup ? "bg-blue-500" : ""}">
            <span class="block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${backupConfig.autoBackup ? "translate-x-4" : ""}"></span>
          </label>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Frequenza Backup</label>
        <div class="space-y-2">
          <div class="flex items-center">
            <input type="radio" id="daily" name="backup-frequency" value="daily" 
              ${backupConfig.backupFrequency === "daily" ? "checked" : ""} 
              ${!backupConfig.autoBackup ? "disabled" : ""} 
              onchange="backupConfig.backupFrequency = this.value" />
            <label for="daily" class="ml-2 text-sm text-gray-700">Giornaliera</label>
          </div>
          <div class="flex items-center">
            <input type="radio" id="weekly" name="backup-frequency" value="weekly" 
              ${backupConfig.backupFrequency === "weekly" ? "checked" : ""} 
              ${!backupConfig.autoBackup ? "disabled" : ""} 
              onchange="backupConfig.backupFrequency = this.value" />
            <label for="weekly" class="ml-2 text-sm text-gray-700">Settimanale</label>
          </div>
          <div class="flex items-center">
            <input type="radio" id="monthly" name="backup-frequency" value="monthly" 
              ${backupConfig.backupFrequency === "monthly" ? "checked" : ""} 
              ${!backupConfig.autoBackup ? "disabled" : ""} 
              onchange="backupConfig.backupFrequency = this.value" />
            <label for="monthly" class="ml-2 text-sm text-gray-700">Mensile</label>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGeneralSettingsStep() {
  return `
    <h2 class="text-xl font-semibold flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Impostazioni Generali
    </h2>
    <p class="text-gray-600 mb-4">Configura le impostazioni generali dell'applicazione</p>
    
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Nome Studio Medico</label>
        <input type="text" value="${generalSettings.clinicName}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          placeholder="Studio Medico Dr. Rossi" 
          onchange="generalSettings.clinicName = this.value" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Indirizzo</label>
        <input type="text" value="${generalSettings.address}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          placeholder="Via Roma 123, 00100 Roma" 
          onchange="generalSettings.address = this.value" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value="${generalSettings.email}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            placeholder="info@studiomedico.it" 
            onchange="generalSettings.email = this.value" />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Telefono</label>
          <input type="text" value="${generalSettings.phone}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            placeholder="+39 06 12345678" 
            onchange="generalSettings.phone = this.value" />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <label class="block text-sm font-medium text-gray-700">Modalità Scura</label>
          <p class="text-sm text-gray-500">Attiva la modalità scura per l'interfaccia</p>
        </div>
        <div class="relative inline-block w-10 mr-2 align-middle select-none">
          <input type="checkbox" id="dark-mode-toggle" ${generalSettings.darkMode ? "checked" : ""} class="sr-only" 
            onchange="generalSettings.darkMode = this.checked" />
          <label for="dark-mode-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${generalSettings.darkMode ? "bg-blue-500" : ""}">
            <span class="block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${generalSettings.darkMode ? "translate-x-4" : ""}"></span>
          </label>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Lingua</label>
        <select class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          onchange="generalSettings.language = this.value">
          <option value="it" ${generalSettings.language === "it" ? "selected" : ""}>Italiano</option>
          <option value="en" ${generalSettings.language === "en" ? "selected" : ""}>English</option>
        </select>
      </div>
    </div>
  `;
}

// Funzioni di navigazione
function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    progress = (currentStep / totalSteps) * 100;
    renderStep(currentStep);
  }
}

function nextStep() {
  // Validazione specifica per ogni step
  if (currentStep === 1) {
    // Validazione per lo step del database
    if (
      !dbConfig.host ||
      !dbConfig.port ||
      !dbConfig.username ||
      !dbConfig.dbName
    ) {
      alert("Compila tutti i campi del database prima di procedere.");
      return;
    }

    // Verifica se la porta è un numero valido
    const port = parseInt(dbConfig.port);
    if (isNaN(port) || port <= 0 || port > 65535) {
      alert("La porta deve essere un numero valido tra 1 e 65535");
      return;
    }

    // Se non è stato fatto un test di connessione con successo, chiedi conferma
    if (dbConnectionStatus.status !== "success") {
      const confirm = window.confirm(
        "Non hai testato la connessione al database o il test non è riuscito. Vuoi procedere comunque?",
      );
      if (!confirm) return;
    }
  } else if (currentStep === 2) {
    // Validazione per lo step dell'utente amministratore
    if (
      !adminUser.username ||
      !adminUser.password ||
      !adminUser.fullName ||
      !adminUser.email
    ) {
      alert("Compila tutti i campi obbligatori prima di procedere.");
      return;
    }

    // Verifica che le password corrispondano
    if (adminUser.password !== adminUser.confirmPassword) {
      alert("Le password non corrispondono. Verifica e riprova.");
      return;
    }
  } else if (currentStep === 3) {
    // Validazione per lo step della licenza
    if (licenseKey) {
      // Verifica la licenza con la funzione interna
      const verificationResult = verifyLicenseKeyInternal(licenseKey);

      if (!verificationResult.valid) {
        alert(
          `Licenza non valida: ${verificationResult.error || "Formato non riconosciuto"}`,
        );
        return;
      }

      // Aggiorna il tipo di licenza rilevato
      setDetectedLicenseType(verificationResult.licenseType || "basic");
    } else {
      // Se non è stata inserita una licenza, imposta il tipo su basic
      setDetectedLicenseType("basic");
    }
  }

  if (currentStep < totalSteps) {
    currentStep++;
    progress = (currentStep / totalSteps) * 100;
    renderStep(currentStep);
  } else {
    // Complete setup
    completeSetup();
  }
}

// Funzioni di utilità
function togglePasswordVisibility() {
  showPassword = !showPassword;
  renderStep(currentStep);
}

function addConnectionLog(message) {
  connectionLogs.push(`${new Date().toLocaleTimeString()}: ${message}`);
  renderStep(currentStep);
}

function testConnection() {
  // Verifica che tutti i campi siano compilati
  if (
    !dbConfig.host ||
    !dbConfig.port ||
    !dbConfig.username ||
    !dbConfig.dbName
  ) {
    dbConnectionStatus = {
      status: "error",
      message: "Compila tutti i campi prima di testare la connessione",
    };
    renderStep(currentStep);
    return;
  }

  // Imposta lo stato di caricamento
  isDbLoading = true;
  dbConnectionStatus = { status: "idle", message: "" };
  connectionLogs = [];
  addConnectionLog("Avvio test di connessione al database...");
  renderStep(currentStep);

  // Verifica se la porta è un numero valido
  const port = parseInt(dbConfig.port);
  if (isNaN(port) || port <= 0 || port > 65535) {
    dbConnectionStatus = {
      status: "error",
      message: "La porta deve essere un numero valido tra 1 e 65535",
    };
    addConnectionLog(
      "Errore: La porta deve essere un numero valido tra 1 e 65535",
    );
    isDbLoading = false;
    renderStep(currentStep);
    return;
  }

  // Verifica che l'host sia in un formato valido
  const hostRegex = /^[a-zA-Z0-9.-]+$/;
  if (!hostRegex.test(dbConfig.host)) {
    dbConnectionStatus = {
      status: "error",
      message: "Formato host non valido",
    };
    addConnectionLog("Errore: Formato host non valido");
    isDbLoading = false;
    renderStep(currentStep);
    return;
  }

  addConnectionLog(
    `Tentativo di connessione a ${dbConfig.host}:${dbConfig.port}...`,
  );

  // Simula un ritardo per il test di connessione
  setTimeout(() => {
    // Simula un successo (in un'applicazione reale, qui ci sarebbe una vera connessione al database)
    const success = Math.random() > 0.3; // 70% di probabilità di successo

    if (success) {
      dbConnectionStatus = {
        status: "success",
        message: "Connessione riuscita! Database disponibile.",
      };
      addConnectionLog("Connessione al database riuscita!");
      addConnectionLog("Verifica delle tabelle in corso...");

      // Simula la creazione delle tabelle
      setTimeout(() => {
        const tables = [
          "users",
          "patients",
          "appointments",
          "license",
          "configurations",
        ];
        tables.forEach((table) => {
          addConnectionLog(`Tabella ${table} creata/verificata con successo`);
        });
        addConnectionLog("Setup database completato con successo");
        isDbLoading = false;
        renderStep(currentStep);
      }, 1000);
    } else {
      dbConnectionStatus = {
        status: "error",
        message:
          "Errore di connessione al database. Verifica le credenziali e che il server sia in esecuzione.",
      };
      addConnectionLog(
        "Errore di connessione: Impossibile connettersi al database",
      );
      isDbLoading = false;
      renderStep(currentStep);
    }
  }, 2000);
}

function verifyLicense() {
  if (!licenseKey) {
    alert("Inserisci una chiave di licenza prima di verificarla.");
    return;
  }

  try {
    // Verifica la licenza con la funzione interna
    const verificationResult = verifyLicenseKeyInternal(licenseKey);

    if (verificationResult.valid) {
      const expiryDate =
        verificationResult.expiryDate?.toLocaleDateString() ||
        "data sconosciuta";
      const licenseTypeNames = {
        basic: "Base",
        google: "Base + Google Calendar",
        whatsapp: "Base + WhatsApp",
        full: "Completa",
      };
      const typeName =
        licenseTypeNames[verificationResult.licenseType || "basic"];

      // Aggiorna il tipo di licenza rilevato
      setDetectedLicenseType(verificationResult.licenseType || "basic");

      alert(`Licenza valida! \nTipo: ${typeName} \nScadenza: ${expiryDate}`);
    } else {
      // Resetta il tipo di licenza rilevato se non valida
      setDetectedLicenseType(null);
      alert(
        `Licenza non valida: ${verificationResult.error || "Formato non riconosciuto"}`,
      );
    }
  } catch (error) {
    console.error("Errore durante la verifica della licenza:", error);
    alert("Si è verificato un errore durante la verifica della licenza.");
  }
}

function completeSetup() {
  try {
    // Verifica che tutti i dati necessari siano presenti
    if (!adminUser.username || !adminUser.password || !adminUser.email) {
      alert(
        "Dati utente amministratore incompleti. Torna al passaggio 2 e completa tutti i campi.",
      );
      currentStep = 2;
      progress = (2 / totalSteps) * 100;
      renderStep(currentStep);
      return;
    }

    // Verifica la licenza se è stata inserita
    if (licenseKey) {
      const verificationResult = verifyLicenseKeyInternal(licenseKey);

      if (!verificationResult.valid) {
        alert(
          `Licenza non valida: ${verificationResult.error || "Formato non riconosciuto"}`,
        );
        setCurrentStep(3);
        setProgress((3 / totalSteps) * 100);
        return;
      }

      // Salva il tipo di licenza per l'uso nell'applicazione
      const licenseType = verificationResult.licenseType || "basic";
      localStorage.setItem("licenseType", licenseType);
      localStorage.setItem("licenseKey", licenseKey);
      if (verificationResult.expiryDate) {
        localStorage.setItem(
          "licenseExpiry",
          verificationResult.expiryDate.toISOString(),
        );
      }

      // Aggiorna il tipo di licenza rilevato
      setDetectedLicenseType(licenseType);
    } else {
      // Licenza base di default
      localStorage.setItem("licenseType", "basic");
      setDetectedLicenseType("basic");
    }

    // Mostra un messaggio di caricamento
    setupContainer.innerHTML = `
      <div class="text-center py-12">
        <div class="spinner mx-auto mb-4"></div>
        <h3 class="text-lg font-medium mb-2">Completamento Setup in corso...</h3>
        <p class="text-gray-500">Stiamo configurando il sistema con i parametri inseriti.</p>
      </div>
    `;

    // Simula un ritardo per il completamento del setup
    setTimeout(() => {
      // Mostra un messaggio di successo
      setupContainer.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg font-medium mb-2">Setup Completato con Successo!</h3>
          <p class="text-gray-500 mb-6">Il sistema è stato configurato correttamente e ora è pronto per l'uso.</p>
          <button id="start-app-button" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Avvia Applicazione
          </button>
        </div>
      `;

      // Aggiungi event listener per il pulsante di avvio
      document
        .getElementById("start-app-button")
        .addEventListener("click", () => {
          // In un'applicazione reale, qui avvieremmo l'applicazione principale
          window.location.href = "../index.html";
        });
    }, 3000);
  } catch (error) {
    console.error("Errore durante il setup:", error);
    alert(
      "Si è verificato un errore durante il setup. Controlla la console per i dettagli.",
    );
  }
}
