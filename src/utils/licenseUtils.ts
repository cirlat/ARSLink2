/**
 * Utility per la gestione delle licenze
 */

import { LicenseModel } from "@/models/license";

// Chiave segreta per la generazione e verifica delle licenze
const LICENSE_SECRET = "ARSLink2-SecretKey-2024";

/**
 * Genera una chiave di licenza valida
 * @param type Tipo di licenza (basic, google, whatsapp, full)
 * @param expiryMonths Numero di mesi di validità
 * @returns Chiave di licenza generata
 */
export function generateLicenseKey(
  type: "basic" | "google" | "whatsapp" | "full",
  expiryMonths: number = 12,
): string {
  // Genera un ID univoco basato sul timestamp e un numero casuale
  const uniqueId =
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 5).toUpperCase();

  // Data di scadenza in formato timestamp
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
  const expiryTimestamp = expiryDate.getTime();

  // Codifica la data di scadenza in base36 per renderla più compatta
  const expiryCode = expiryTimestamp.toString(36).toUpperCase();

  // Crea la parte principale della licenza
  const licenseBase = `${type.toUpperCase()}-${uniqueId}-${expiryCode}`;

  // Genera un checksum semplice (in un'implementazione reale, usare un algoritmo più robusto)
  const checksum = generateChecksum(licenseBase + LICENSE_SECRET);

  // Formatta la licenza finale
  return `${licenseBase}-${checksum}`;
}

/**
 * Verifica la validità di una chiave di licenza
 * @param licenseKey Chiave di licenza da verificare
 * @returns Oggetto con informazioni sulla validità della licenza
 */
export function verifyLicenseKey(licenseKey: string): {
  valid: boolean;
  licenseType?: "basic" | "google" | "whatsapp" | "full";
  expiryDate?: Date;
  error?: string;
} {
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
        licenseType: type as "basic" | "google" | "whatsapp" | "full",
        expiryDate,
        error: "Licenza scaduta",
      };
    }

    // Licenza valida
    return {
      valid: true,
      licenseType: type as "basic" | "google" | "whatsapp" | "full",
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
function generateChecksum(input: string): string {
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

/**
 * Installa una licenza nel sistema
 * @param licenseKey Chiave di licenza da installare
 * @returns Risultato dell'installazione
 */
export async function installLicense(licenseKey: string): Promise<{
  success: boolean;
  message: string;
  licenseType?: string;
  expiryDate?: Date;
}> {
  // Verifica la licenza
  const verificationResult = verifyLicenseKey(licenseKey);

  if (!verificationResult.valid) {
    return {
      success: false,
      message: verificationResult.error || "Licenza non valida",
    };
  }

  try {
    // Salva la licenza nel localStorage per uso immediato
    localStorage.setItem("licenseKey", licenseKey);
    localStorage.setItem("licenseType", verificationResult.licenseType || "");
    localStorage.setItem(
      "licenseExpiry",
      verificationResult.expiryDate?.toISOString() || "",
    );

    // In un'implementazione reale, salveremmo anche nel database
    const licenseModel = LicenseModel.getInstance();
    await licenseModel.installLicense({
      license_key: licenseKey,
      license_type: verificationResult.licenseType || "basic",
      expiry_date: verificationResult.expiryDate || new Date(),
      google_calendar_enabled:
        verificationResult.licenseType === "google" ||
        verificationResult.licenseType === "full",
      whatsapp_enabled:
        verificationResult.licenseType === "whatsapp" ||
        verificationResult.licenseType === "full",
    });

    return {
      success: true,
      message: "Licenza installata con successo",
      licenseType: verificationResult.licenseType,
      expiryDate: verificationResult.expiryDate,
    };
  } catch (error) {
    console.error("Errore durante l'installazione della licenza:", error);
    return {
      success: false,
      message: "Errore durante l'installazione della licenza",
    };
  }
}
