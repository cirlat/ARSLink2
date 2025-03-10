/**
 * Utility functions for license management
 */

/**
 * Check if the current license includes WhatsApp functionality
 * @returns boolean indicating if WhatsApp is available
 */
export const hasWhatsAppLicense = (): boolean => {
  const licenseType = localStorage.getItem("licenseType");
  return (
    licenseType === "whatsapp" ||
    licenseType === "full" ||
    (licenseType && licenseType.startsWith("WHATSAPP-")) ||
    (licenseType && licenseType.startsWith("FULL-"))
  );
};

/**
 * Check if the current license includes Google Calendar functionality
 * @returns boolean indicating if Google Calendar is available
 */
export const hasGoogleCalendarLicense = (): boolean => {
  const licenseType = localStorage.getItem("licenseType");
  return (
    licenseType === "google" ||
    licenseType === "full" ||
    (licenseType && licenseType.startsWith("GOOGLE-")) ||
    (licenseType && licenseType.startsWith("FULL-"))
  );
};

/**
 * Check if the license is expired
 * @returns boolean indicating if the license is expired
 */
export const isLicenseExpired = (): boolean => {
  const licenseExpiry = localStorage.getItem("licenseExpiry");
  if (!licenseExpiry) return true;

  const expiryDate = new Date(licenseExpiry);
  const now = new Date();
  return expiryDate < now;
};

/**
 * Get the number of days remaining until license expiration
 * @returns number of days remaining, or 0 if expired
 */
export const getLicenseRemainingDays = (): number => {
  const licenseExpiry = localStorage.getItem("licenseExpiry");
  if (!licenseExpiry) return 0;

  const expiryDate = new Date(licenseExpiry);
  const now = new Date();

  if (expiryDate < now) return 0;

  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get the license type in a user-friendly format
 * @returns string representing the license type
 */
export const getLicenseTypeDisplay = (): string => {
  const licenseType = localStorage.getItem("licenseType");

  if (!licenseType) return "Non attiva";

  if (licenseType === "full" || licenseType.startsWith("FULL-")) {
    return "Completa";
  }

  if (licenseType === "whatsapp" || licenseType.startsWith("WHATSAPP-")) {
    return "WhatsApp";
  }

  if (licenseType === "google" || licenseType.startsWith("GOOGLE-")) {
    return "Google Calendar";
  }

  return "Base";
};
