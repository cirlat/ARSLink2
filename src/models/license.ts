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
        // Crea un oggetto licenza dai dati in localStorage
        const license: License = {
          license_key: storedLicenseKey,
          license_type: storedLicenseType as
            | "basic"
            | "google"
            | "whatsapp"
            | "full",
          expiry_date: new Date(storedLicenseExpiry),
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
        this.currentLicense = JSON.parse(storedLicense);
        console.log(
          "Licenza caricata da localStorage (fallback):",
          this.currentLicense,
        );
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
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async isGoogleCalendarEnabled(): Promise<boolean> {
    const license = await this.getCurrentLicense();
    if (!license) return false;

    return license.google_calendar_enabled && (await this.isLicenseValid());
  }

  async isWhatsAppEnabled(): Promise<boolean> {
    const license = await this.getCurrentLicense();
    if (!license) return false;

    return license.whatsapp_enabled && (await this.isLicenseValid());
  }

  async installLicense(licenseData: License): Promise<License> {
    try {
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

      // Salva anche in localStorage come backup
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
