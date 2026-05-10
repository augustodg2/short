export class InvalidTokenError extends Error {
  constructor(message: string = "Invalid token", options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidTokenError";
  }
}
