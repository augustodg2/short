export class MalformedCachedLinkError extends Error {
  readonly cachedLink: string;

  constructor(
    message: string = "The link fetched from cache has wrong format",
    cachedLink: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.cachedLink = cachedLink;
    this.name = "MalformedCachedLinkError";
  }
}
