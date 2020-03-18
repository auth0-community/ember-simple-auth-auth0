import { readOnly, bool } from '@ember/object/computed';
import { getOwner } from '@ember/application';
import { getProperties, get, getWithDefault, computed } from '@ember/object';
import { assert, debug } from '@ember/debug';
import { isEmpty, isPresent } from '@ember/utils';
import Service, { inject as service } from '@ember/service';
import { assign } from '@ember/polyfills';
import RSVP from 'rsvp';
import Auth0 from 'auth0-js';
import createSessionDataObject from '../utils/create-session-data-object';
import { Auth0Error } from '../utils/errors'

export default Service.extend({
  session: service(),
  cookies: service(),

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

  /**
   * The URL to return to when logging out
   * @type {String}
   */
  logoutReturnToURL: computed('config.{logoutReturnToURL,logoutReturnToPath}', function() {
    const logoutReturnToPath = get(this, 'config.logoutReturnToPath');
    if (logoutReturnToPath) {
      assert('ember-simple-auth-auth0 logoutReturnToPath must start with /', logoutReturnToPath.startsWith('/'));
      return window.location.origin + logoutReturnToPath;
    }
    return get(this, 'config.logoutReturnToURL');
  }),

  /**
   * Enable user impersonation. This is opt-in due to security risks.
   * @type {bool}
   */
  enableImpersonation: bool('config.enableImpersonation'),

  /**
   * Number of seconds between auto-renewing token via silent authentication.
   * @type {number}
   */
  silentAuthRenewSeconds: readOnly('config.silentAuth.renewSeconds'),

  /**
   * Automatically perform silent authentication on session restore.
   * @type {bool}
   */
  silentAuthOnSessionRestore: bool('config.silentAuth.onSessionRestore'),

  /**
   * Automatically perform silent authentication on session expiration.
   * @type {bool}
   */
  silentAuthOnSessionExpire: bool('config.silentAuth.onSessionExpire'),

  /**
   * Default options to use when performing silent authentication.
   * This is a function rather than a computed property since the
   * default redirectUri needs to be regenerated every time.
   * 
   * @method _getSilentAuthOptions
   * @return {Object}
   */
  _getSilentAuthOptions() {
    const defaultOptions = {
      responseType: 'token',
      scope: 'openid',
      redirectUri: window.location.origin,
      timeout: 5000
    };
    const configOptions = getWithDefault(this, 'config.silentAuth.options', {});
    const redirectPath = configOptions.redirectPath;

    // Support redirectPath which becomes redirectUri with the origin location prepended.
    if (redirectPath) {
      assert('ember-simple-auth-auth0 redirectPath must start with /', redirectPath.startsWith('/'));
      configOptions.redirectUri = window.location.origin + redirectPath;
    }

    // [XA] convoluted assign logic, just in case the Ember.Merge fallback is used.
    const options = {};
    assign(options, defaultOptions);
    assign(options, configOptions);
    return options;
  },

  /**
   * Perform Silent Authentication with Auth0's checkSession() method.
   * Returns the authenticated data if successful, or rejects if not.
   *
   * This method does NOT actually create an ember-simple-auth session;
   * use the authenticator rather than calling this directly.
   *
   * @method silentAuth
   * @param {Object} options
   */
  silentAuth(options) {
    if(!options) {
      options = this._getSilentAuthOptions();
    }
    return new RSVP.Promise((resolve, reject) => {
      const auth0 = this._getAuth0Instance();
      auth0.checkSession(options, (err, data) => {
        if(!err) {
          // special check: running this with Ember Inspector active
          // results in an ember version object getting returned for
          // some oddball reason. Reject and warn the user (dev?).
          if(data && get(data, 'type') === 'emberVersion') {
            reject(new Auth0Error('Silent Authentication is not supported when Ember Inspector is enabled. Please disable the extension to re-enable support.'));
          } else {
            resolve(data);
          }
        } else {
          reject(new Auth0Error(err));
        }
      });
    });
  },

  /**
   * Creates an authorization header from the session's token and calls
   * the given function, passing the header name & value as parameters.
   *
   * This method exists mainly for convencience, though it serves as a
   * handy drop-in replacement for the now-deprecated jwtAuthorizer.
   *
   * Just like with ember-simple-auth's authorizers, this method will do
   * nothing if the session is not authenticated.
   *
   * @method authorize
   * @param {Object} block
   */
  authorize(block) {
    if (get(this, 'session.isAuthenticated')) {
      const userToken = get(this, 'session.data.authenticated.idToken');

      if (isPresent(userToken)) {
        block('Authorization', `Bearer ${userToken}`);
      } else {
        debug('Could not find idToken in authenticated session data.');
      }
    }
  },

  /**
   * Redirect to Auth0's Universal Login page.
   *
   * @method universalLogin
   * @param {Object} options
   */
  universalLogin(options)
  {
    // save the attempted transition URL so ember-simple-auth
    // will restore it once Auth0 redirects back to the app.
    let transitionPath = get(this, 'session.attemptedTransition.intent.url');
    if(transitionPath) {
      get(this, 'cookies').write('ember_simple_auth-redirectTarget', transitionPath, {
        path: '/',
        secure: window.location.protocol === 'https:'
      });
    }

    // redirect to the login page.
    const auth0 = this._getAuth0Instance();
    const authOptions = assign({ redirectUri: window.location.origin }, options);
    auth0.authorize(authOptions);

    // since the above triggers a redirect away from the
    // Ember app, return a never-fulfilling promise.
    const noop = () => {};
    return new RSVP.Promise(noop);
  },

  /**
   * Show Lock.
   *
   * @method showLock
   * @param {Object} options
   * @param {String} clientID
   * @param {String} domain
   * @param {Boolean} passwordless
   */
  showLock(options, clientID = null, domain = null, passwordless = false) {
    return new RSVP.Promise((resolve, reject) => {
      this._getAuth0LockInstance(options, clientID, domain, passwordless).then(lock => {
        this._setupLock(lock, resolve, reject);
        lock.show();
      }, reject);
    });
  },

  showPasswordlessLock(options, clientID = null, domain = null) {
    return this.showLock(options, clientID, domain, true);
  },

  _setupLock(lock, resolve, reject) {
    lock.on('authenticated', (authenticatedData) => {
      if (isEmpty(authenticatedData)) {
        return reject(new Auth0Error('The authenticated data did not come back from the request'));
      }

      lock.getUserInfo(authenticatedData.accessToken, (error, profile) => {
        if (error) {
          return reject(new Auth0Error(error));
        }

        return resolve(createSessionDataObject(profile, authenticatedData));
      });
    });

    // [XA] shim for tests -- need to wait until the above 'authenticated'
    // listener is registered before triggering it during unit tests.
    if (lock.trigger && this.get('inTesting')) {
      lock.trigger('_setupCompleted');
    }
  },

  _getAuth0LockModule() {
    return import('auth0-lock');
  },

  _getAuth0LockInstance(options, clientID = null, domain = null, passwordless = false) {
    clientID = clientID || get(this, 'clientID');
    domain = domain || get(this, 'domain');

    return this._getAuth0LockModule().then(module => {
      const Auth0LockConstructor = passwordless ? module.Auth0LockPasswordless : module.Auth0Lock;
      return new Auth0LockConstructor(clientID, domain, options);
    })
  },

  _getAuth0Instance(clientID = null, domain = null) {
    clientID = clientID || get(this, 'clientID');
    domain = domain || get(this, 'domain');

    return new Auth0.WebAuth({
      domain,
      clientID
    });
  },

  _navigateToLogoutURL(logoutUrl) {
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
      this._navigateToLogoutURL(logoutUrl);
    });
  },

  _environmentConfig: computed({
    get() {
      return getOwner(this).resolveRegistration('config:environment');
    }
  })
});
