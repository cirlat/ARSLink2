import Database from "./database";

export interface License {
  id?: number;
  license_key: string;
  license_type: "basic" | "google" | "whatsapp" | "full";
  expiry_date: Date;
  google_calendar_enabled: boolean;
  whatsapp_enabled: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class LicenseModel {
  private db: Database;
  private static instance: LicenseModel;
  private currentLicense: License | null = null;

  private constructor() {
    this.db = Database.getInstance();
    this.loadLicense();
  }

  public static getInstance(): LicenseModel {
    if (!LicenseModel.instance) {
      LicenseModel.instance = new LicenseModel();
    }
    return LicenseModel.instance;
  }

  private async loadLicense(): Promise<void> {
    try {
      // Tenta di caricare la licenza dal database
      const licenses = await this.db.query(
        "SELECT * FROM license ORDER BY created_at DESC LIMIT 1",
      );
      if (licenses.length > 0) {
        this.currentLicense = licenses[0];
        console.log("Licenza caricata dal database:", this.currentLicense);
        return;
      }

      // Se non c'è licenza nel database, verifica se c'è una licenza in localStorage
      const storedLicenseKey = localStorage.getItem("licenseKey");
      const storedLicenseType = localStorage.getItem("licenseType");
      const storedLicenseExpiry = localStorage.getItem("licenseExpiry");

      if (storedLicenseKey && storedLicenseType && storedLicenseExpiry) {
        // Verifica la validità della licenza usando la funzione di verifica
        const { verifyLicenseKey } = await import("@/utils/licenseUtils");
        const verificationResult = verifyLicenseKey(storedLicenseKey);

        if (!verificationResult.valid) {
          console.warn(
            "Licenza in localStorage non valida:",
            verificationResult.error,
          );
          return;
        }

        // Usa la data di scadenza dalla verifica, che è più affidabile
        const expiryDate =
          verificationResult.expiryDate || new Date(storedLicenseExpiry);

        // Crea un oggetto licenza dai dati in localStorage
        const license: License = {
          license_key: storedLicenseKey,
          license_type:
            verificationResult.licenseType ||
            (storedLicenseType as "basic" | "google" | "whatsapp" | "full"),
          expiry_date: expiryDate,
          google_calendar_enabled:
            storedLicenseType === "google" || storedLicenseType === "full",
          whatsapp_enabled:
            storedLicenseType === "whatsapp" || storedLicenseType === "full",
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Salva la licenza nel database
        try {
          await this.installLicense(license);
          console.log("Licenza da localStorage installata nel database");
        } catch (installError) {
          console.error(
            "Errore nell'installazione della licenza nel database:",
            installError,
          );
          // Se non riusciamo a salvarla nel database, la teniamo in memoria
          this.currentLicense = license;
        }
      }
    } catch (error) {
      console.error("Error loading license:", error);

      // Fallback completo a localStorage
      const storedLicense = localStorage.getItem("license");
      if (storedLicense) {
        try {
          const parsedLicense = JSON.parse(storedLicense);

          // Verifica che la licenza sia un oggetto valido
          if (
            parsedLicense &&
            parsedLicense.license_key &&
            parsedLicense.expiry_date
          ) {
            // Assicurati che expiry_date sia un oggetto Date
            parsedLicense.expiry_date = new Date(parsedLicense.expiry_date);
            this.currentLicense = parsedLicense;
            console.log(
              "Licenza caricata da localStorage (fallback):",
              this.currentLicense,
            );
          }
        } catch (parseError) {
          console.error(
            "Errore nel parsing della licenza da localStorage:",
            parseError,
          );
        }
      }
    }
  }

  async getCurrentLicense(): Promise<License | null> {
    if (!this.currentLicense) {
      await this.loadLicense();
    }
    return this.currentLicense;
  }

  async isLicenseValid(): Promise<boolean> {
    try {
      // Verifica prima nel database
      const license = await this.getCurrentLicense();
      if (license) {
        const today = new Date();
        const expiryDate = new Date(license.expiry_date);
        return expiryDate >= today;
      }

      // Se non c'è nel database, verifica nel localStorage
      const storedLicenseExpiry = localStorage.getItem("licenseExpiry");
      if (storedLicenseExpiry) {
        const expiryDate = new Date(storedLicenseExpiry);
        const today = new Date();
        return expiryDate >= today;
      }

      return false;
    } catch (error) {
      console.error(
        "Errore nella verifica della validità della licenza:",
        error,
      );

      // Fallback a localStorage
      const storedLicenseExpiry = localStorage.getItem("licenseExpiry");
      if (storedLicenseExpiry) {
        const expiryDate = new Date(storedLicenseExpiry);
        const today = new Date();
        return expiryDate >= today;
      }

      return false;
    }
  }

  async getDaysUntilExpiry(): Promise<number> {
    const license = await this.getCurrentLicense();
    if (!license) return 0;

    const today = new Date();
    const expiryDate = new Date(license.expiry_date);

    // Verifica che la data di scadenza sia valida
    if (isNaN(expiryDate.getTime())) {
      console.error(
        "Data di scadenza della licenza non valida:",
        license.expiry_date,
      );
      return 0;
    }

    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
  }

  async isGoogleCalendarEnabled(): Promise<boolean> {
    try {
      const license = await this.getCurrentLicense();
      if (!license) return false;

      // Se la licenza è di tipo FULL, abilita Google Calendar
      if (
        license.license_type.toLowerCase() === "full" &&
        (await this.isLicenseValid())
      ) {
        return true;
      }

      // Altrimenti controlla le features specifiche
      return license.google_calendar_enabled && (await this.isLicenseValid());
    } catch (error) {
      console.error("Error checking Google Calendar license:", error);
      return false;
    }
  }

  async isWhatsAppEnabled(): Promise<boolean> {
    try {
      const license = await this.getCurrentLicense();
      if (!license) return false;

      // Se la licenza è di tipo FULL, abilita WhatsApp
      if (
        license.license_type.toLowerCase() === "full" &&
        (await this.isLicenseValid())
      ) {
        return true;
      }

      // Altrimenti controlla le features specifiche
      return license.whatsapp_enabled && (await this.isLicenseValid());
    } catch (error) {
      console.error("Error checking WhatsApp license:", error);
      return false;
    }
  }

  async installLicense(licenseData: License): Promise<License> {
    try {
      // Verifica che la data di scadenza sia un oggetto Date valido
      if (
        !(licenseData.expiry_date instanceof Date) ||
        isNaN(licenseData.expiry_date.getTime())
      ) {
        if (typeof licenseData.expiry_date === "string") {
          licenseData.expiry_date = new Date(licenseData.expiry_date);
        } else {
          throw new Error("Data di scadenza della licenza non valida");
        }
      }

      // Prima verifichiamo se esiste già una licenza
      const existingLicense = await this.db.query(
        "SELECT * FROM license LIMIT 1",
      );

      let result;
      if (existingLicense.length > 0) {
        // Aggiorna la licenza esistente
        result = await this.db.query(
          `UPDATE license SET 
            license_key = $1, 
            license_type = $2, 
            expiry_date = $3, 
            google_calendar_enabled = $4, 
            whatsapp_enabled = $5, 
            updated_at = $6 
          WHERE id = $7 RETURNING *`,
          [
            licenseData.license_key,
            licenseData.license_type,
            licenseData.expiry_date,
            licenseData.google_calendar_enabled,
            licenseData.whatsapp_enabled,
            new Date(),
            existingLicense[0].id,
          ],
        );
      } else {
        // Inserisci una nuova licenza
        result = await this.db.query(
          `INSERT INTO license (
            license_key, license_type, expiry_date, 
            google_calendar_enabled, whatsapp_enabled
          ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [
            licenseData.license_key,
            licenseData.license_type,
            licenseData.expiry_date,
            licenseData.google_calendar_enabled,
            licenseData.whatsapp_enabled,
          ],
        );
      }

      this.currentLicense = result[0];

      // Aggiorna anche i valori in localStorage
      localStorage.setItem("licenseKey", licenseData.license_key);
      localStorage.setItem("licenseType", licenseData.license_type);
      localStorage.setItem(
        "licenseExpiry",
        licenseData.expiry_date.toISOString(),
      );

      // Salva anche l'oggetto completo in localStorage come backup
      localStorage.setItem("license", JSON.stringify(this.currentLicense));

      return this.currentLicense;
    } catch (error) {
      console.error("Error installing license:", error);
      throw error;
    }
  }

  async verifyLicenseKey(licenseKey: string): Promise<{
    valid: boolean;
    licenseType?: "basic" | "google" | "whatsapp" | "full";
    expiryDate?: Date;
    error?: string;
  }> {
    // Utilizziamo la funzione di verifica dalla utility delle licenze
    const { verifyLicenseKey } = await import("@/utils/licenseUtils");
    return verifyLicenseKey(licenseKey);
  }
}
