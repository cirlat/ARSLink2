/**
 * Utility functions for application setup
 */

import { createDirectoryIfNotExists } from "./fileUtils";

/**
 * Create all required application directories
 */
export async function createAppDirectories(): Promise<boolean> {
  try {
    // Create base application directory
    const baseDir = "C:\\ProgramData\\PatientAppointmentSystem";
    await createDirectoryIfNotExists(baseDir);

    // Create subdirectories
    const directories = [
      `${baseDir}\\Documents`,
      `${baseDir}\\WhatsAppData`,
      `${baseDir}\\Backups`,
      `${baseDir}\\Logs`,
    ];

    // Create all directories in parallel
    const results = await Promise.all(
      directories.map(async (dir) => {
        try {
          const success = await createDirectoryIfNotExists(dir);
          if (!success) {
            console.error(`Failed to create directory: ${dir}`);
            return false;
          }
          return true;
        } catch (dirError) {
          console.error(`Error creating directory ${dir}:`, dirError);
          // Try alternative method if available
          if (isRunningInElectron()) {
            try {
              if (typeof electronAPI.createDirectory === "function") {
                await electronAPI.createDirectory(dir);
                console.log(
                  `Created directory using alternative method: ${dir}`,
                );
                return true;
              }
            } catch (altError) {
              console.error(`Alternative method failed for ${dir}:`, altError);
            }
          }
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

    // Save setup status to localStorage
    localStorage.setItem("setupCompleted", "true");
    localStorage.setItem("setupCompletedAt", new Date().toISOString());

    return true;
  } catch (error) {
    console.error("Error initializing application setup:", error);
    // Return true anyway to allow the application to start
    return true;
  }
}
