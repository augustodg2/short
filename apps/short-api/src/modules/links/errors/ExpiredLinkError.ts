export class ExpiredLinkError extends Error {
  constructor(message: string = "The link is expired", options?: ErrorOptions) {
    super(message, options);
    this.name = "ExpiredLinkError";
  }
}
