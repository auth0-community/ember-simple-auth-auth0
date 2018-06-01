import EmberError from '@ember/error';

export function Auth0Error(payload) {
  let message = 'Auth0 operation failed'

  if(typeof payload === 'object' && payload !== null) {
    if (payload.errorDescription) {
      payload.errorDescription = decodeURI(payload.errorDescription);
    }
    const errorCode = payload.error || 'unknown'
    const errorDesc = payload.errorDescription || message
    message = `Auth0 returned error \`${errorCode}\`: ${errorDesc}`
  } else if(typeof payload === 'string') {
    message += `: ${payload}`
    payload = {}
  }

  EmberError.call(this, message);
  this.payload = payload;
}

Auth0Error.prototype = Object.create(EmberError.prototype);
