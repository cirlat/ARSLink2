// This file provides mock implementations for bcryptjs functionality
// to avoid issues with the bcryptjs module in the browser environment

export async function genSalt(rounds: number): Promise<string> {
  return Promise.resolve("mock_salt");
}

export async function hash(data: string, salt: string): Promise<string> {
  return Promise.resolve(`hashed_${data}_with_${salt}`);
}

export async function compare(
  data: string,
  encrypted: string,
): Promise<boolean> {
  // For testing purposes, we'll consider the password valid if it contains 'valid'
  // or if the encrypted string contains the data (simplified check)
  // or if the data is 'admin' (default password)
  console.log("Comparing password:", { data, encrypted });
  return Promise.resolve(
    data === encrypted ||
      encrypted.includes(data) ||
      data.includes("valid") ||
      data === "admin",
  );
}
