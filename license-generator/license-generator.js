/**
 * Generatore di licenze per ARSLink2
 * Questo è un'applicazione standalone che non fa parte del software principale
 */

// Chiave segreta per la generazione e verifica delle licenze
const LICENSE_SECRET = "ARSLink2-SecretKey-2024";

// Elementi DOM
const generateBtn = document.getElementById("generateBtn");
const licenseResult = document.getElementById("licenseResult");
const licenseKeyInput = document.getElementById("licenseKey");
const copyBtn = document.getElementById("copyBtn");
const copyMessage = document.getElementById("copyMessage");
const licenseTable = document.getElementById("licenseTable");
const noLicenses = document.getElementById("noLicenses");

// Carica le licenze salvate
let generatedLicenses = JSON.parse(
  localStorage.getItem("generatedLicenses") || "[]",
);

// Aggiorna la tabella delle licenze
function updateLicenseTable() {
  const tbody = licenseTable.querySelector("tbody");
  tbody.innerHTML = "";

  if (generatedLicenses.length === 0) {
    noLicenses.classList.remove("hidden");
    return;
  }

  noLicenses.classList.add("hidden");

  generatedLicenses.forEach((license, index) => {
    const row = document.createElement("tr");

    // Tipo di licenza
    const typeCell = document.createElement("td");
    typeCell.className = "px-6 py-4 whitespace-nowrap";
    typeCell.innerHTML = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLicenseTypeColor(license.type)}">${getLicenseTypeName(license.type)}</span>`;
    row.appendChild(typeCell);

    // Chiave di licenza
    const keyCell = document.createElement("td");
    keyCell.className =
      "px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500";
    keyCell.textContent = license.key;
    row.appendChild(keyCell);

    // Data di scadenza
    const expiryCell = document.createElement("td");
    expiryCell.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500";
    expiryCell.textContent = new Date(license.expiryDate).toLocaleDateString();
    row.appendChild(expiryCell);

    // Azioni
    const actionsCell = document.createElement("td");
    actionsCell.className = "px-6 py-4 whitespace-nowrap text-sm font-medium";

    const copyAction = document.createElement("button");
    copyAction.className = "text-blue-600 hover:text-blue-900 mr-3";
    copyAction.textContent = "Copia";
    copyAction.onclick = () => copyToClipboard(license.key);
    actionsCell.appendChild(copyAction);

    const deleteAction = document.createElement("button");
    deleteAction.className = "text-red-600 hover:text-red-900";
    deleteAction.textContent = "Elimina";
    deleteAction.onclick = () => deleteLicense(index);
    actionsCell.appendChild(deleteAction);

    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });
}

// Genera una chiave di licenza
function generateLicenseKey(type, expiryMonths) {
  // Genera un ID univoco basato sul timestamp e un numero casuale
  const uniqueId =
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 5).toUpperCase();

  // Data di scadenza in formato timestamp
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + parseInt(expiryMonths));
  const expiryTimestamp = expiryDate.getTime();

  // Codifica la data di scadenza in base36 per renderla più compatta
  const expiryCode = expiryTimestamp.toString(36).toUpperCase();

  // Crea la parte principale della licenza
  const licenseBase = `${type.toUpperCase()}-${uniqueId}-${expiryCode}`;

  // Genera un checksum semplice
  const checksum = generateChecksum(licenseBase + LICENSE_SECRET);

  // Formatta la licenza finale
  return {
    key: `${licenseBase}-${checksum}`,
    type: type,
    expiryDate: expiryDate,
  };
}

// Genera un checksum semplice per la verifica della licenza
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

// Copia il testo negli appunti
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Mostra il messaggio di conferma
      copyMessage.classList.remove("hidden");
      setTimeout(() => {
        copyMessage.classList.add("hidden");
      }, 2000);
    })
    .catch((err) => {
      console.error("Errore durante la copia: ", err);
    });
}

// Elimina una licenza
function deleteLicense(index) {
  if (confirm("Sei sicuro di voler eliminare questa licenza?")) {
    generatedLicenses.splice(index, 1);
    localStorage.setItem(
      "generatedLicenses",
      JSON.stringify(generatedLicenses),
    );
    updateLicenseTable();
  }
}

// Ottieni il nome del tipo di licenza
function getLicenseTypeName(type) {
  switch (type) {
    case "basic":
      return "Base";
    case "google":
      return "Google Calendar";
    case "whatsapp":
      return "WhatsApp";
    case "full":
      return "Completa";
    default:
      return type;
  }
}

// Ottieni il colore del tipo di licenza
function getLicenseTypeColor(type) {
  switch (type) {
    case "basic":
      return "bg-gray-100 text-gray-800";
    case "google":
      return "bg-blue-100 text-blue-800";
    case "whatsapp":
      return "bg-green-100 text-green-800";
    case "full":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Event listeners
generateBtn.addEventListener("click", () => {
  const licenseType = document.getElementById("licenseType").value;
  const duration = document.getElementById("duration").value;

  const license = generateLicenseKey(licenseType, duration);

  // Mostra il risultato
  licenseKeyInput.value = license.key;
  licenseResult.classList.remove("hidden");

  // Salva la licenza generata
  generatedLicenses.push(license);
  localStorage.setItem("generatedLicenses", JSON.stringify(generatedLicenses));

  // Aggiorna la tabella
  updateLicenseTable();
});

copyBtn.addEventListener("click", () => {
  copyToClipboard(licenseKeyInput.value);
});

// Inizializza la tabella delle licenze
updateLicenseTable();
