export class EmailAlreadyInUseError extends Error {
  constructor(
    message: string = "Email already in use",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "EmailAlreadyInUseError";
  }
}
