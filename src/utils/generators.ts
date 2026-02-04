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