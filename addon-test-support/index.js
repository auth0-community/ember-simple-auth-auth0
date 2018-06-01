import RSVP from 'rsvp';
import { getContext, settled } from '@ember/test-helpers';
import { set } from '@ember/object';
import createSessionDataObject from 'ember-simple-auth-auth0/utils/create-session-data-object';

export function mockAuth0Lock(sessionData) {
  const { owner } = getContext();
  const auth0 = owner.lookup('service:auth0');
  set(auth0, 'test_showLock', auth0.showLock.bind(auth0));

  auth0.showLock = function() {
    return RSVP.resolve(createSessionDataObject({}, sessionData));
  }.bind(auth0);

  return settled();
}
