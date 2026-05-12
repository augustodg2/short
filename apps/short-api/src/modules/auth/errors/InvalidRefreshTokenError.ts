export class InvalidRefreshTokenError extends Error {
  constructor(
    message: string = "Invalid refresh token",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "InvalidRefreshTokenError";
  }
}
