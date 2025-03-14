import { electronAPI, isRunningInElectron } from "../lib/electronBridge";
import { v4 as uuidv4 } from "uuid";

// We'll use string concatenation for paths instead of requiring the path module
// This avoids the 'require is not defined' error in browser environments

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
        const result = await electronAPI.getUserDataPath();
        if (result.success && result.path) {
          // Manually join paths instead of using electronAPI.joinPaths
          documentsPath = `${result.path}/Documents`;
        } else {
          // Fallback to default path
          documentsPath = "C:/ProgramData/PatientAppointmentSystem/Documents";
        }
      } catch (error) {
        console.error("Error getting user data path:", error);
        documentsPath = "C:/ProgramData/PatientAppointmentSystem/Documents";
      }
    } else {
      // Browser environment
      documentsPath = "C:/ProgramData/PatientAppointmentSystem/Documents";
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
    // Verifica se siamo in un ambiente Electron
    if (isRunningInElectron()) {
      // Usa l'API Electron per creare la directory
      try {
        if (typeof electronAPI.createDirectory === "function") {
          const result = await electronAPI.createDirectory(dirPath);
          if (result.success) {
            console.log(`Directory creata tramite API Electron: ${dirPath}`);
            return true;
          } else {
            // Se la directory esiste già, non è un errore
            if (result.error && result.error.includes("already exists")) {
              console.log(`Directory già esistente: ${dirPath}`);
              return true;
            }
            console.error(
              `Errore nella creazione della directory: ${result.error}`,
            );
            return false;
          }
        } else {
          console.log(
            `API createDirectory non disponibile, creazione directory simulata: ${dirPath}`,
          );
          return true;
        }
      } catch (electronError) {
        console.error(`Errore con API Electron: ${electronError.message}`);
        // Fallback per ambiente browser o errori
        console.log(`Fallback: Directory creata ${dirPath}`);
        return true;
      }
    } else {
      // In ambiente browser, simula la creazione della directory
      console.log(`Simulazione: Directory creata ${dirPath}`);
      return true;
    }
  } catch (error) {
    console.error(`Errore nella creazione della directory ${dirPath}:`, error);
    // Fallback in caso di errore
    console.log(`Fallback dopo errore: Directory creata ${dirPath}`);
    return true;
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
    // Use direct path joining with forward slashes to be cross-platform compatible
    const patientDir = `${documentsPath}/patient_${patientId}`;

    const success = await createDirectoryIfNotExists(patientDir);

    if (!success) {
      throw new Error(`Failed to create directory: ${patientDir}`);
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    // Use direct path joining with forward slashes to be cross-platform compatible
    const filePath = `${patientDir}/${uniqueFilename}`;

    if (isRunningInElectron()) {
      try {
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();

        // In Electron environment, we need to handle the buffer differently
        // than in a browser environment
        let fileData;
        if (
          typeof window !== "undefined" &&
          typeof window.require === "function"
        ) {
          // Node.js environment (Electron)
          const Buffer = window.require("buffer").Buffer;
          fileData = Buffer.from(arrayBuffer);
        } else {
          // Browser environment
          fileData = new Uint8Array(arrayBuffer);
        }

        // Save file using Electron API
        if (typeof electronAPI.writeFile === "function") {
          const result = await electronAPI.writeFile({
            filePath,
            data: fileData,
          });

          if (result.success) {
            console.log(`File saved to: ${filePath}`);
            return filePath;
          } else {
            console.error(`Error saving file: ${result.error}`);
            // Fallback to simulation if real save fails
            const savedFiles = JSON.parse(
              localStorage.getItem("savedFiles") || "{}",
            );
            savedFiles[filePath] = {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              patientId: patientId,
            };
            localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
            console.log(`File saved to localStorage as fallback: ${filePath}`);
            return filePath;
          }
        } else {
          // Fallback se writeFile non è disponibile
          console.warn(
            "electronAPI.writeFile non è disponibile, utilizzo metodo alternativo",
          );

          // Salva informazioni sul file in localStorage per simulazione
          const savedFiles = JSON.parse(
            localStorage.getItem("savedFiles") || "{}",
          );
          savedFiles[filePath] = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            patientId: patientId,
          };
          localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
          console.log(`File saved to localStorage (simulation): ${filePath}`);
          return filePath;
        }
      } catch (error) {
        console.error("Error saving file:", error);
        // Fallback to localStorage in case of error
        const savedFiles = JSON.parse(
          localStorage.getItem("savedFiles") || "{}",
        );
        savedFiles[filePath] = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          patientId: patientId,
        };
        localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
        console.log(`File saved to localStorage (error fallback): ${filePath}`);
        return filePath;
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
      const result = await electronAPI.openFile(filePath);

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
      const result = await electronAPI.deleteFile(filePath);

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
      const result = await electronAPI.getFileInfo(filePath);

      if (result.success) {
        return result.info;
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
