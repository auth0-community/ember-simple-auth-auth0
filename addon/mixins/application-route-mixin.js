import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

const {
  Mixin,
  computed,
  get,
  getWithDefault,
  set,
  RSVP,
  RSVP: {
    resolve
  },
  inject: {
    service
  },
  run,
  testing,
  isEmpty,
} = Ember;

export default Mixin.create(ApplicationRouteMixin, {
  session: service(),
  auth0: service(),

  sessionAuthenticated() {
    this._setupFutureEvents();
    this._super(...arguments);
  },

  /**
   * Hook that gets called after the jwt has expired
   * but before we notify the rest of the system.
   * Great place to add cleanup to expire any third-party
   * tokens or other cleanup.
   *
   * IMPORTANT: You must return a promise, else logout
   * will not continue.
   *
   * @return {Promise}
   */
  beforeSessionExpired() {
    return resolve();
  },

  /**
   * This has to be overridden because the default behavior prevents
   * auth0 to logout correctly.
   */
  sessionInvalidated() {
    this._clearJobs();
    return this._super(...arguments);
  },

  beforeModel() {
    this._setupFutureEvents();
    let promise = resolve(this._super(...arguments));

    promise = promise
      .then(this._getUrlHashData.bind(this))
      .then(this._authenticateWithUrlHash.bind(this));

    return promise;
  },

  willDestroy() {
    this._clearJobs();
  },

  _authenticateWithUrlHash(urlHashData) {
    if (isEmpty(urlHashData)) {
      return;
    }

    return get(this, 'session').authenticate('authenticator:auth0-url-hash', urlHashData);
  },

  _getUrlHashData() {
    if (get(this, 'auth0.isGreaterThanVersion8')) {
      return this._getNewUrlHashData();
    }

    return this._getDeprecatedUrlHashData();
  },

  _getNewUrlHashData() {
		if (typeof FastBoot !== "undefined") { return RSVP.resolve(); }

    const auth0 = get(this, 'auth0').getAuth0Instance();
    return new RSVP.Promise((resolve, reject) => {
      // TODO: Check to see if we cannot parse the hash or check to see which version of auth0 we are using.... ugh
      auth0.parseHash((err, parsedPayload) => {
        if (err) {
          if (err.errorDescription) {
            err.errorDescription = decodeURI(err.errorDescription);
          }

          return reject(err);
        }

        resolve(parsedPayload);
      });
    });
  },

  _getDeprecatedUrlHashData() {
		if (typeof FastBoot !== "undefined") { return RSVP.resolve(); }

    return new RSVP.Promise((resolve, reject) => {

      const auth0 = get(this, 'auth0').getAuth0Instance();
      const parsedPayload = auth0.parseHash();

      if (parsedPayload && parsedPayload.error && parsedPayload.error_description) {
        parsedPayload.errorDescription = decodeURI(parsedPayload.error_description);
        delete parsedPayload.error_description;
        return reject(parsedPayload);
      }

      return resolve(parsedPayload);
    });
  },
  _setupFutureEvents() {
    // Don't schedule expired events during testing, otherwise acceptance tests will hang.
    if (testing) {
      return;
    }

    this._scheduleExpire();
  },

  _scheduleExpire() {
    run.cancel(get(this, '_expireJob'));
    const expireInMilli = get(this, '_jwtRemainingTimeInSeconds') * 1000;
    const job = run.later(this, this._processSessionExpired, expireInMilli);
    set(this, '_expireJob', job);
  },

  /**
   * The current JWT's expire time
   * @return {Number in seconds}
   */
  _expiresAt: computed('session.data.authenticated', {
    get() {
      let exp = 0;

      if (!get(this, 'session.isAuthenticated')) {
        return exp;
      }

      const foo = getWithDefault(this, 'session.data.authenticated.idTokenPayload.exp', exp);

      return getWithDefault(this, 'session.data.authenticated.expiresIn', foo);
    }
  }),

  _jwtRemainingTimeInSeconds: computed('_expiresAt', {
    get() {
      return getWithDefault(this, '_expiresAt', 0);
    }
  }),

  _clearJobs() {
    run.cancel(get(this, '_expireJob'));
  },

  _processSessionExpired() {
    return this.beforeSessionExpired()
      .then(this._invalidateIfAuthenticated.bind(this));
  },

  _invalidateIfAuthenticated() {
    let session = get(this, 'session');

    if (get(session, 'isAuthenticated')) {
      session.invalidate();
    }
  }
});
