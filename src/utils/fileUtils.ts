import { electronAPI, isRunningInElectron } from "../lib/electronBridge";
import { v4 as uuidv4 } from "uuid";
import path from "path";

/**
 * Get the documents directory path
 * @returns The path to the documents directory
 */
export async function getDocumentsPath(): Promise<string> {
  // Default path for documents
  let documentsPath = localStorage.getItem("documentsPath") || "";

  if (!documentsPath) {
    if (isRunningInElectron()) {
      try {
        // Get user data path from Electron
        const result = await electronAPI.executeQuery("GET_USER_DATA_PATH", []);
        if (result.success && result.rows && result.rows.length > 0) {
          documentsPath = path.join(result.rows[0], "Documents");
        } else {
          // Fallback to default path
          documentsPath =
            "C:\\ProgramData\\PatientAppointmentSystem\\Documents";
        }
      } catch (error) {
        console.error("Error getting user data path:", error);
        documentsPath = "C:\\ProgramData\\PatientAppointmentSystem\\Documents";
      }
    } else {
      // Browser environment
      documentsPath = "C:\\ProgramData\\PatientAppointmentSystem\\Documents";
    }

    // Save the path to localStorage
    localStorage.setItem("documentsPath", documentsPath);
  }

  return documentsPath;
}

/**
 * Create directory if it doesn't exist
 * @param dirPath Directory path to create
 * @returns True if directory exists or was created successfully
 */
export async function createDirectoryIfNotExists(
  dirPath: string,
): Promise<boolean> {
  try {
    if (isRunningInElectron()) {
      try {
        // Use Electron API to create directory
        const result = await electronAPI.executeQuery("CREATE_DIRECTORY", [
          dirPath,
        ]);
        if (result.success) {
          console.log(`Directory created: ${dirPath}`);
          return true;
        } else {
          // If directory already exists, this is not an error
          if (result.error && result.error.includes("already exists")) {
            console.log(`Directory already exists: ${dirPath}`);
            return true;
          }
          console.error(`Error creating directory: ${result.error}`);
          return false;
        }
      } catch (error) {
        console.error(`Error accessing filesystem: ${error.message}`);
        throw error;
      }
    } else {
      // In browser environment, simulate directory creation
      console.log(`Simulation: Directory created ${dirPath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    return false;
  }
}

/**
 * Save file to disk
 * @param file File to save
 * @param patientId Patient ID for organizing files
 * @returns Path to saved file or null if failed
 */
export async function saveFile(
  file: File,
  patientId: number,
): Promise<string | null> {
  try {
    // Get base documents path
    const documentsPath = await getDocumentsPath();

    // Create patient-specific directory
    const patientDir = path.join(documentsPath, `patient_${patientId}`);
    const success = await createDirectoryIfNotExists(patientDir);

    if (!success) {
      throw new Error(`Failed to create directory: ${patientDir}`);
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(patientDir, uniqueFilename);

    if (isRunningInElectron()) {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save file using Electron API
      const result = await electronAPI.executeQuery("SAVE_FILE", [
        filePath,
        buffer,
      ]);

      if (result.success) {
        console.log(`File saved to: ${filePath}`);
        return filePath;
      } else {
        console.error(`Error saving file: ${result.error}`);
        return null;
      }
    } else {
      // In browser environment, simulate file saving
      console.log(`Simulation: File saved to ${filePath}`);
      // Store file info in localStorage for simulation
      const savedFiles = JSON.parse(localStorage.getItem("savedFiles") || "{}");
      savedFiles[filePath] = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      localStorage.setItem("savedFiles", JSON.stringify(savedFiles));

      return filePath;
    }
  } catch (error) {
    console.error("Error saving file:", error);
    return null;
  }
}

/**
 * Save multiple files to disk
 * @param files Files to save
 * @param patientId Patient ID for organizing files
 * @returns Array of paths to saved files
 */
export async function saveFiles(
  files: FileList,
  patientId: number,
): Promise<string[]> {
  const savedPaths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = await saveFile(file, patientId);
    if (path) {
      savedPaths.push(path);
    }
  }

  return savedPaths;
}

/**
 * Open file with default application
 * @param filePath Path to file to open
 * @returns True if file was opened successfully
 */
export async function openFile(filePath: string): Promise<boolean> {
  try {
    if (isRunningInElectron()) {
      // Open file using Electron API
      const result = await electronAPI.executeQuery("OPEN_FILE", [filePath]);

      if (result.success) {
        console.log(`File opened: ${filePath}`);
        return true;
      } else {
        console.error(`Error opening file: ${result.error}`);
        return false;
      }
    } else {
      // In browser environment, simulate file opening
      console.log(`Simulation: Opening file ${filePath}`);

      // Check if file exists in simulation storage
      const savedFiles = JSON.parse(localStorage.getItem("savedFiles") || "{}");
      if (savedFiles[filePath]) {
        console.log(`Simulation: File ${filePath} opened successfully`);
        return true;
      } else {
        console.error(`Simulation: File ${filePath} not found`);
        return false;
      }
    }
  } catch (error) {
    console.error("Error opening file:", error);
    return false;
  }
}

/**
 * Delete file from disk
 * @param filePath Path to file to delete
 * @returns True if file was deleted successfully
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    if (isRunningInElectron()) {
      // Delete file using Electron API
      const result = await electronAPI.executeQuery("DELETE_FILE", [filePath]);

      if (result.success) {
        console.log(`File deleted: ${filePath}`);
        return true;
      } else {
        console.error(`Error deleting file: ${result.error}`);
        return false;
      }
    } else {
      // In browser environment, simulate file deletion
      console.log(`Simulation: Deleting file ${filePath}`);

      // Remove file from simulation storage
      const savedFiles = JSON.parse(localStorage.getItem("savedFiles") || "{}");
      if (savedFiles[filePath]) {
        delete savedFiles[filePath];
        localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
        console.log(`Simulation: File ${filePath} deleted successfully`);
        return true;
      } else {
        console.error(`Simulation: File ${filePath} not found`);
        return false;
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}
