import { readOnly } from '@ember/object/computed';
import { getOwner } from '@ember/application';
import { getProperties, get, computed } from '@ember/object';
import { assert } from '@ember/debug';
import { isEmpty } from '@ember/utils';
import Service, { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import Auth0 from 'auth0';
import { Auth0Lock, Auth0LockPasswordless } from 'auth0-lock';
import createSessionDataObject from '../utils/create-session-data-object';
import { Auth0Error } from '../utils/errors'

export default Service.extend({
  session: service(),

  inTesting: computed(function() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.environment === 'test';
  }),

  /**
   * The env config found in the environment config.
   * ENV['ember-simple-auth'].auth0
   *
   * @type {Object}
   */
  config: computed({
    get() {
      const emberSimpleAuthConfig = get(this, '_environmentConfig')['ember-simple-auth'];
      assert('ember-simple-auth config must be defined', emberSimpleAuthConfig);
      assert('ember-simple-auth.auth0 config must be defined', emberSimpleAuthConfig.auth0);

      return emberSimpleAuthConfig.auth0;
    }
  }),

  /**
   * The Auth0 App ClientID found in your Auth0 dashboard
   * @type {String}
   */
  clientID: readOnly('config.clientID'),

  /**
   * The Auth0 App Domain found in your Auth0 dashboard
   * @type {String}
   */
  domain: readOnly('config.domain'),

  logoutReturnToURL: readOnly('config.logoutReturnToURL'),

  showLock(options, clientID = null, domain = null, passwordless = false) {
    return new RSVP.Promise((resolve, reject) => {
      const lock = this.getAuth0LockInstance(options, clientID, domain, passwordless);
      this._setupLock(lock, resolve, reject);
      lock.show();
    });
  },

  showPasswordlessLock(options, clientID = null, domain = null) {
    return this.showLock(options, clientID, domain, true);
  },

  _setupLock(lock, resolve, reject) {
    lock.on('unrecoverable_error', reject);
    lock.on('authorization_error', reject);

    // lock.on('hash_parsed', resolve);
    lock.on('authenticated', (authenticatedData) => {
      if (isEmpty(authenticatedData)) {
        return reject(new Auth0Error('The authenticated data did not come back from the request'));
      }

      lock.getUserInfo(authenticatedData.accessToken, (error, profile) => {
        if (error) {
          return reject(new Auth0Error(error));
        }

        resolve(createSessionDataObject(profile, authenticatedData));
      });
    });
  },

  getAuth0LockInstance(options, clientID = null, domain = null, passwordless = false) {
    clientID = clientID || get(this, 'clientID');
    domain = domain || get(this, 'domain');
    const Auth0LockConstructor = get(this, passwordless ? '_auth0LockPasswordless' : '_auth0Lock');

    return new Auth0LockConstructor(clientID, domain, options);
  },

  getAuth0Instance(clientID = null, domain = null) {
    clientID = clientID || get(this, 'clientID');
    domain = domain || get(this, 'domain');

    const Auth0Constructor = get(this, '_auth0.WebAuth');

    return new Auth0Constructor({
      domain,
      clientID
    });
  },

  getAuth0LockPasswordlessInstance(options, clientID = null, domain = null) {
    return this.getAuth0LockInstance(options, clientID, domain, true);
  },

  navigateToLogoutURL(logoutUrl) {
    let {
      domain,
      logoutReturnToURL,
      clientID
    } = getProperties(this, 'domain', 'logoutReturnToURL', 'clientID');
    
    logoutReturnToURL = logoutUrl || logoutReturnToURL;

    if (!this.get('inTesting')) {
      window.location.replace(`https://${domain}/v2/logout?returnTo=${logoutReturnToURL}&client_id=${clientID}`);
    }
  },

  logout(logoutUrl) {
    get(this, 'session').invalidate().then(() => {
      this.navigateToLogoutURL(logoutUrl);
    });
  },

  _auth0: computed(function() {
    return Auth0;
  }),

  _auth0Lock: computed(function() {
    return Auth0Lock;
  }),

  _auth0LockPasswordless: computed(function() {
    return Auth0LockPasswordless;
  }),

  _environmentConfig: computed({
    get() {
      return getOwner(this).resolveRegistration('config:environment');
    }
  }),
});
