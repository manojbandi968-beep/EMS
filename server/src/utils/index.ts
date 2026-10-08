// Utilities helper functions
export const formatResponse = (success: boolean, message: string, data?: any) => ({
  success,
  message,
  ...(data !== undefined && { data }),
});
