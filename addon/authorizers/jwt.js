import { isPresent } from '@ember/utils';
import { debug } from '@ember/debug';
import BaseAuthorizer from 'ember-simple-auth/authorizers/base';

export default BaseAuthorizer.extend({
  authorize(sessionData, block) {
    let userToken = sessionData['idToken'];

    if (isPresent(userToken)) {
      block('Authorization', `Bearer ${userToken}`);
    } else {
      debug('Could not find the authorization token in the session data for the jwt authorizer.');
    }
  }
});
