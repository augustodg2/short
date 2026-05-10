export class InvalidCredentialsError extends Error {
  constructor(message: string = "Invalid credentials", options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidCredentialsError";
  }
}
