import { getWithDefault, get } from '@ember/object';

/**
 * Get the token expiration time from the specified session data object.
 * If an ID token is defined, use the `exp` field since it's nice and
 * well-defined. Otherwise, calculate an expiration time from the
 * expiresIn field and the time the session object was created.
 * 
 * @return {Expiration time of token (Unix timestamp)}
 */
export default function getSessionExpiration(sessionData) {
  const idTokenExpiration = get(sessionData, 'idTokenPayload.exp');

  if(idTokenExpiration) {
    return idTokenExpiration;

  } else {
    const issuedAt = getWithDefault(sessionData, 'issuedAt', 0);
    const expiresIn = getWithDefault(sessionData, 'expiresIn', 0);

    return issuedAt + expiresIn;
  }
}
