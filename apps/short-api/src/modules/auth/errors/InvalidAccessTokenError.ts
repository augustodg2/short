export class InvalidAccessTokenError extends Error {
  constructor(
    message: string = "Invalid access token",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "InvalidAccessTokenError";
  }
}
