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
 * Set the documents directory path
 * @param path The new path to set for documents
 * @returns True if path was set successfully
 */
export function setDocumentsPath(path: string): boolean {
  try {
    localStorage.setItem("documentsPath", path);
    return true;
  } catch (error) {
    console.error("Error setting documents path:", error);
    return false;
  }
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
        // In Electron, we need to use a specific command for file system operations
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
      // In browser environment, we need to use the File System Access API
      try {
        // For browser testing, we'll just log and return true
        console.log(`Creating directory: ${dirPath}`);
        return true;
      } catch (fsError) {
        console.error(`Error creating directory: ${fsError.message}`);
        return false;
      }
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
      const result = await electronAPI.executeQuery("WRITE_FILE", [
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
      // In browser environment, we need to use the File System Access API
      try {
        // For browser testing, we'll store file info in localStorage
        const savedFiles = JSON.parse(
          localStorage.getItem("savedFiles") || "{}",
        );
        const originalFilename = file.name;
        savedFiles[filePath] = {
          name: originalFilename,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          patientId: patientId,
        };
        localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
        console.log(`File saved to: ${filePath}`);
        return filePath;
      } catch (fsError) {
        console.error(`Error saving file: ${fsError.message}`);
        return null;
      }
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
    const filePath = await saveFile(file, patientId);
    if (filePath) {
      savedPaths.push(filePath);
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
      // In browser environment, we need to use the File System Access API
      try {
        // For browser testing, we'll just log and return true if the file exists in our simulation storage
        const savedFiles = JSON.parse(
          localStorage.getItem("savedFiles") || "{}",
        );
        if (savedFiles[filePath]) {
          console.log(`File opened: ${filePath}`);

          // If it's an image, we could open it in a new tab
          const fileType = savedFiles[filePath].type;
          if (fileType.startsWith("image/")) {
            // Create a blob URL and open it in a new tab
            // This is just a simulation - in a real app, we'd use the actual file
            window.open("https://picsum.photos/800/600", "_blank");
          } else if (fileType.startsWith("application/pdf")) {
            window.open(
              "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              "_blank",
            );
          }

          return true;
        } else {
          console.error(`File not found: ${filePath}`);
          return false;
        }
      } catch (fsError) {
        console.error(`Error opening file: ${fsError.message}`);
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
      // In browser environment, we need to use the File System Access API
      try {
        // For browser testing, we'll just remove the file from our simulation storage
        const savedFiles = JSON.parse(
          localStorage.getItem("savedFiles") || "{}",
        );
        if (savedFiles[filePath]) {
          delete savedFiles[filePath];
          localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
          console.log(`File deleted: ${filePath}`);
          return true;
        } else {
          console.error(`File not found: ${filePath}`);
          return false;
        }
      } catch (fsError) {
        console.error(`Error deleting file: ${fsError.message}`);
        return false;
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

/**
 * Get file info
 * @param filePath Path to file
 * @returns File info object or null if file not found
 */
export async function getFileInfo(filePath: string): Promise<any | null> {
  try {
    if (isRunningInElectron()) {
      // Get file info using Electron API
      const result = await electronAPI.executeQuery("GET_FILE_INFO", [
        filePath,
      ]);

      if (result.success) {
        return result.rows[0];
      } else {
        console.error(`Error getting file info: ${result.error}`);
        return null;
      }
    } else {
      // In browser environment, we'll use our simulation storage
      const savedFiles = JSON.parse(localStorage.getItem("savedFiles") || "{}");
      if (savedFiles[filePath]) {
        return savedFiles[filePath];
      } else {
        console.error(`File not found: ${filePath}`);
        return null;
      }
    }
  } catch (error) {
    console.error("Error getting file info:", error);
    return null;
  }
}
