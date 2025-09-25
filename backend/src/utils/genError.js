// backend/utils/generror.js
export const genError = (statusCode, message) => {
  const err = new Error(message || "Error");
  err.statusCode = statusCode; // your error handler reads statusCode
  return err;
};
