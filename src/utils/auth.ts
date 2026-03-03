


export const isAccountLocked = (user: {
  lockUntil?: Date | null;
}) => {
  return user.lockUntil && user.lockUntil > new Date();
};