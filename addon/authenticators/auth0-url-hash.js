import RSVP from 'rsvp';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import Auth0BaseAuthenticator from 'ember-simple-auth-auth0/authenticators/auth0-base';
import createSessionDataObject from '../utils/create-session-data-object';
import { Auth0Error } from '../utils/errors'

export default Auth0BaseAuthenticator.extend({
  auth0: service(),
  session: service(),
  authenticate(urlHashData) {
    return new RSVP.Promise((resolve, reject) => {
      if (isEmpty(urlHashData)) {
        reject();
      }
      const auth0 = get(this, 'auth0').getAuth0Instance();
      const getUserInfo = auth0.client.userInfo.bind(auth0.client);

      getUserInfo(urlHashData.accessToken, (err, profile) => {
        if (err) {
          return reject(new Auth0Error(err));
        }

        resolve(createSessionDataObject(profile, urlHashData));
      });
    });
  },
});
