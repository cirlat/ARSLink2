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

    for (const dir of directories) {
      const success = await createDirectoryIfNotExists(dir);
      if (!success) {
        console.error(`Failed to create directory: ${dir}`);
        return false;
      }
    }

    console.log("All application directories created successfully");
    return true;
  } catch (error) {
    console.error("Error creating application directories:", error);
    return false;
  }
}

/**
 * Initialize application setup
 */
export async function initializeAppSetup(): Promise<boolean> {
  try {
    // Create required directories
    const directoriesCreated = await createAppDirectories();
    if (!directoriesCreated) {
      console.error("Failed to create required directories");
      return false;
    }

    // Save setup status to localStorage
    localStorage.setItem("setupCompleted", "true");
    localStorage.setItem("setupCompletedAt", new Date().toISOString());

    return true;
  } catch (error) {
    console.error("Error initializing application setup:", error);
    return false;
  }
}
