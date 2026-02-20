module.exports = {
  SUCCESS: "Request completed successfully.",
  ACCEPTED: "Request accepted for processing.",
  NO_CONTENT: "Request completed successfully. No content returned.",
  ERROR: "An error occurred",
  NOT_FOUND: "Page Not Found",
  VALIDATION_ERROR: "Validation failed",
  INVALID_API_VERSION: "Invalid API version",

  // CRUD
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",

  // Error
  BAD_REQUEST: "The request is invalid.",
  UNAUTHORIZED: "Unauthorized access",
  PAYMENT_REQUIRED: "Payment is required to complete this request.",
  FORBIDDEN: "You do not have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  METHOD_NOT_ALLOWED: "The requested method is not allowed for this resource.",
  NOT_ACCEPTABLE: "The requested content type is not acceptable.",
  REQUEST_TIMEOUT: "The request timed out.",
  CONFLICT: "The request could not be completed due to a conflict.",
  UNPROCESSABLE_ENTITY: "The request contains invalid or incomplete data.",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",

  // User related
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User already exists",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_DISABLED: "Account is disabled",
  PASSWORD_CHANGED: "Password changed successfully",
  PASSWORD_INCORRECT: "Incorrect password",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REGISTRATION_SUCCESS: "Registration successful",

  // Token / Auth
  TOKEN_MISSING: "Authorization token is missing",
  ACCESS_DENIED: "Access denied",
  TOKEN_EXPIRED: "Authentication token has expired.",
  TOKEN_INVALID: "Authentication token is invalid.",

  // Data / Input
  INVALID_INPUT: "Invalid input data",
  DATA_NOT_FOUND: "Requested data not found",
  DATA_EXISTS: "Data already exists",
  OPERATION_FAILED: "Operation failed",
  OPERATION_SUCCESS: "Operation successful",
  
  // Server / System
  INTERNAL_SERVER_ERROR: "An unexpected server error occurred.",
  NOT_IMPLEMENTED: "This functionality is not implemented.",
  BAD_GATEWAY: "Invalid response from upstream server.",
  SERVICE_UNAVAILABLE: "The service is currently unavailable.",
  GATEWAY_TIMEOUT: "The upstream server did not respond in time.",
  SERVER_ERROR: "Internal server error",
};