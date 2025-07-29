class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.message = message;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      success: this.success,
      errors: this.errors,
    };
  }
}

export { ApiError };
