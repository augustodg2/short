import { InvalidRefreshTokenError } from "./InvalidRefreshTokenError.js";

export class RevokedRefreshTokenError extends InvalidRefreshTokenError {
  constructor(
    message: string = "Revoked refresh token",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RevokedRefreshTokenError";
  }
}
