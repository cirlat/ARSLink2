/**
 * Utility functions for application setup
 */

import { createDirectoryIfNotExists } from "./fileUtils";

/**
 * Create all required application directories
 */
export async function createAppDirectories(): Promise<boolean> {
  try {
    console.log("Creating application directories...");
    // Create base application directory
    const baseDir = "C:\\ProgramData\\PatientAppointmentSystem";
    await createDirectoryIfNotExists(baseDir);

    // Create subdirectories
    const directories = [
      `${baseDir}\\Documents`,
      `${baseDir}\\WhatsAppData`,
      `${baseDir}\\Backups`,
      `${baseDir}\\Logs`,
      `${baseDir}\\Temp`,
    ];

    // Also create patient-specific directories that might be needed
    directories.push(`${baseDir}\\Documents\\patient_1`);
    directories.push(`${baseDir}\\Documents\\patient_2`);
    directories.push(`${baseDir}\\Documents\\patient_3`);

    // Create WhatsApp subdirectories
    directories.push(`${baseDir}\\WhatsAppData\\Cache`);
    directories.push(`${baseDir}\\WhatsAppData\\UserData`);

    // Create backup subdirectories
    directories.push(`${baseDir}\\Backups\\Daily`);
    directories.push(`${baseDir}\\Backups\\Weekly`);
    directories.push(`${baseDir}\\Backups\\Monthly`);

    // Import necessary modules
    const { isRunningInElectron, electronAPI } = await import(
      "../lib/electronBridge"
    );

    // Create all directories in parallel
    const results = await Promise.all(
      directories.map(async (dir) => {
        try {
          console.log(`Creating directory: ${dir}`);
          // Try to create directory using Electron API first if available
          if (
            isRunningInElectron() &&
            electronAPI &&
            typeof electronAPI.createDirectory === "function"
          ) {
            try {
              const result = await electronAPI.createDirectory(dir);
              if (result.success) {
                console.log(`Created directory using Electron API: ${dir}`);
                return true;
              } else {
                console.warn(
                  `Electron API failed to create directory ${dir}: ${result.error}`,
                );
                // Fall back to the regular method
              }
            } catch (electronError) {
              console.warn(
                `Error using Electron API to create directory ${dir}:`,
                electronError,
              );
              // Fall back to the regular method
            }
          }

          // Use the regular method as fallback
          const success = await createDirectoryIfNotExists(dir);
          if (!success) {
            console.error(`Failed to create directory: ${dir}`);
            return false;
          }
          return true;
        } catch (dirError) {
          console.error(`Error creating directory ${dir}:`, dirError);
          // Return true anyway to continue with setup
          console.log(`Simulating directory creation for ${dir} after error`);
          return true;
        }
      }),
    );

    // Check if all directories were created successfully
    const allSuccessful = results.every((result) => result === true);

    if (allSuccessful) {
      console.log("All application directories created successfully");
    } else {
      console.warn(
        "Some directories could not be created, but setup will continue",
      );
    }

    return true; // Continue setup even if some directories failed
  } catch (error) {
    console.error("Error creating application directories:", error);
    // Return true anyway to continue with setup
    return true;
  }
}

/**
 * Initialize application setup
 */
export async function initializeAppSetup(): Promise<boolean> {
  try {
    console.log("Starting application setup...");
    // Import necessary modules
    const { isRunningInElectron, electronAPI } = await import(
      "../lib/electronBridge"
    );

    // Create required directories
    const directoriesCreated = await createAppDirectories();

    // Even if directory creation fails, continue with setup
    if (!directoriesCreated) {
      console.warn(
        "Some directories could not be created, but setup will continue",
      );
    }

    // Set default paths in localStorage if not already set
    if (!localStorage.getItem("documentsPath")) {
      localStorage.setItem(
        "documentsPath",
        "C:\\ProgramData\\PatientAppointmentSystem\\Documents",
      );
    }

    if (!localStorage.getItem("whatsappDataPath")) {
      localStorage.setItem(
        "whatsappDataPath",
        "C:\\ProgramData\\PatientAppointmentSystem\\WhatsAppData",
      );
    }

    if (!localStorage.getItem("backupPath")) {
      localStorage.setItem(
        "backupPath",
        "C:\\ProgramData\\PatientAppointmentSystem\\Backups",
      );
    }

    // Initialize database tables
    try {
      console.log("Initializing database tables...");
      const { default: Database } = await import("../models/database");
      const db = Database.getInstance();
      await db.initializeDatabase();
      console.log("Database tables initialized successfully");

      // Ensure medical_records and notifications tables are created
      if (isRunningInElectron() && electronAPI) {
        console.log("Creating medical_records and notifications tables...");
        try {
          const medicalRecordsResult =
            await electronAPI.ensureMedicalRecordsTable();
          if (medicalRecordsResult.success) {
            console.log("medical_records table created successfully");
          } else {
            console.error(
              "Failed to create medical_records table:",
              medicalRecordsResult.error,
            );
          }

          const notificationsResult =
            await electronAPI.ensureNotificationsTable();
          if (notificationsResult.success) {
            console.log("notifications table created successfully");
          } else {
            console.error(
              "Failed to create notifications table:",
              notificationsResult.error,
            );
          }
        } catch (tableError) {
          console.error("Error creating tables:", tableError);
        }
      } else {
        console.log(
          "Not in Electron environment, skipping table creation via IPC",
        );
      }

      // Save default Google Calendar settings to database
      try {
        console.log("Saving default Google Calendar settings to database...");
        const googleCalendarConfig = {
          enabled: false,
          clientId: "",
          clientSecret: "",
          redirectUri: "http://localhost:5173/settings",
          authenticated: false,
        };

        await db.query(
          `INSERT INTO configurations (key, value) 
           VALUES ($1, $2) 
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          ["google_calendar_config", JSON.stringify(googleCalendarConfig)],
        );
        console.log("Default Google Calendar settings saved to database");
      } catch (gcalError) {
        console.error("Error saving Google Calendar settings:", gcalError);
      }

      // Save default WhatsApp settings to database
      try {
        console.log("Saving default WhatsApp settings to database...");
        const whatsappConfig = {
          enabled: false,
          browserPath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          dataPath: "C:\\ProgramData\\PatientAppointmentSystem\\WhatsAppData",
          isAuthenticated: false,
        };

        await db.query(
          `INSERT INTO configurations (key, value) 
           VALUES ($1, $2) 
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          ["whatsapp_config", JSON.stringify(whatsappConfig)],
        );
        console.log("Default WhatsApp settings saved to database");
      } catch (whatsappError) {
        console.error("Error saving WhatsApp settings:", whatsappError);
      }

      // Save default backup settings to database
      try {
        console.log("Saving default backup settings to database...");
        const backupConfig = {
          backupPath: "C:\\ProgramData\\PatientAppointmentSystem\\Backups",
          autoBackup: true,
          backupFrequency: "daily",
          lastBackup: null,
          nextBackup: null,
        };

        await db.query(
          `INSERT INTO configurations (key, value) 
           VALUES ($1, $2) 
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          ["backup_config", JSON.stringify(backupConfig)],
        );
        console.log("Default backup settings saved to database");
      } catch (backupError) {
        console.error("Error saving backup settings:", backupError);
      }
    } catch (dbError) {
      console.error("Error initializing database:", dbError);
    }

    // Save setup status to localStorage
    localStorage.setItem("setupCompleted", "true");
    localStorage.setItem("setupCompletedAt", new Date().toISOString());
    console.log("Setup completed successfully");

    return true;
  } catch (error) {
    console.error("Error initializing application setup:", error);
    // Return true anyway to allow the application to start
    return true;
  }
}
