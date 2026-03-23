import crypto from "crypto";

export const generateSecurePassword = (length = 12): string => {
  if (length < 8 || length > 14) {
    throw new Error("Password length must be between 8 and 14 characters");
  }

  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+[]{}|;:,.<>?";

  const allChars = upper + lower + numbers + symbols;

  // Ensure at least one of each type
  const getRandomChar = (chars: string) =>
    chars[crypto.randomInt(0, chars.length)];

  let password = [
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(numbers),
    getRandomChar(symbols),
  ];

  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password.push(getRandomChar(allChars));
  }

  // Shuffle (important)
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
};


export const generateId = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};



const getRemainingLockTime = (lockUntil: Date) => {
  const diffMs = lockUntil.getTime() - Date.now();
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  return hours > 0 ? hours : 0;
};
export { getRemainingLockTime };