/**
 * Utility per generare chiavi di licenza (solo per uso amministrativo)
 */

import { generateLicenseKey } from "./licenseUtils";

/**
 * Genera una serie di chiavi di licenza per i diversi tipi
 * @param count Numero di licenze da generare per tipo
 * @param months Durata in mesi della licenza
 */
export function generateLicenseKeys(count: number = 1, months: number = 12) {
  const licenseTypes = ["basic", "google", "whatsapp", "full"] as const;
  const licenses: Record<string, string[]> = {};

  licenseTypes.forEach((type) => {
    licenses[type] = [];
    for (let i = 0; i < count; i++) {
      licenses[type].push(generateLicenseKey(type, months));
    }
  });

  return licenses;
}

/**
 * Esempio di utilizzo:
 *
 * Per generare licenze di prova, esegui questo codice nella console del browser:
 *
 * ```javascript
 * import { generateLicenseKeys } from "./utils/licenseGenerator";
 * const licenses = generateLicenseKeys(5, 12); // 5 licenze per tipo, valide 12 mesi
 * console.table(licenses);
 * ```
 *
 * Oppure crea un'interfaccia amministrativa per generare licenze da distribuire ai clienti.
 */
