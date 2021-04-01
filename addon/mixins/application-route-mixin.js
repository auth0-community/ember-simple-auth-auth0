import Mixin from '@ember/object/mixin';
import { set, computed } from '@ember/object';
import RSVP, { resolve } from 'rsvp';
import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';
import { isEmpty } from '@ember/utils';
import { getOwner } from '@ember/application';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import { Auth0Error } from '../utils/errors'
import getSessionExpiration from '../utils/get-session-expiration';
import now from '../utils/now';

export default Mixin.create(ApplicationRouteMixin, {
  session: service(),
  auth0: service(),

  inTesting: computed(function() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.environment === 'test';
  }),

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
    if (isEmpty(urlHashData) || typeof FastBoot !== 'undefined') {
      return;
    }

    return this.session.authenticate('authenticator:auth0-url-hash', urlHashData)
      .then(this._clearUrlHash.bind(this));
  },

  _getUrlHashData() {
    if (typeof FastBoot !== 'undefined') {
      return;
    }

    const auth0 = this.auth0._getAuth0Instance();
    const enableImpersonation = this.auth0.enableImpersonation;
    return new RSVP.Promise((resolve, reject) => {
      auth0.parseHash({__enableImpersonation: enableImpersonation}, (err, parsedPayload) => {
        if (err) {
          return reject(new Auth0Error(err));
        }

        resolve(parsedPayload);
      });
    });
  },

  _clearUrlHash() {
    if(typeof FastBoot === 'undefined' && !this.inTesting && window.history) {
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    return RSVP.resolve()
  },

  _setupFutureEvents() {
    // Don't schedule expired events during testing, otherwise acceptance tests will hang.
    if (this.inTesting || typeof FastBoot !== 'undefined') {
      return;
    }

    // [XA] only actually schedule events if we're authenticated.
    if (this.session.isAuthenticated) {
      this._scheduleRenew();
      this._scheduleExpire();
    }
  },

  _scheduleJob(jobName, jobFn, timeInMilli) {
    run.cancel(this.jobName);
    const job = run.later(this, jobFn, timeInMilli);
    set(this, jobName, job);
  },

  _scheduleRenew() {
    if (!Ember.get(this, 'session.isAuthenticated')) {
      this.sessionInvalidated();
    }
    
    const renewInMilli = this.auth0.silentAuthRenewSeconds * 1000;
    if(renewInMilli) {
      this._scheduleJob('_renewJob', this._processSessionRenewed, renewInMilli);
    }
  },

  _scheduleExpire() {
    const expireInMilli = this._jwtRemainingTimeInSeconds * 1000;
    this._scheduleJob('_expireJob', this._processSessionExpired, expireInMilli);
  },

  /**
   * The current JWT's expire time
   * @return {Date of expiration}
   */
  _expiresAt: computed('session.{data.authenticated,isAuthenticated}', {
    get() {
      if (!this.session.isAuthenticated) {
        return 0;
      }

      const sessionData = this.session.data.authenticated;
      return getSessionExpiration(sessionData);
    }
  }),

  /**
   * Number of seconds until the JWT expires.
   * @return {Number in seconds}
   */
  _jwtRemainingTimeInSeconds: computed('_expiresAt', {
    get() {
      let remaining = (this._expiresAt ?? 0) - now();

      return remaining < 0 ? 0 : remaining;
    }
  }),

  _clearJobs() {
    run.cancel(this._renewJob);
    run.cancel(this._expireJob);
  },

  _processSessionRenewed() {
    // [XA] need to refactor this a bit. This is kinda bonkers-spaghetti right now.
    return this._trySilentAuth()
      .then(this._scheduleRenew.bind(this), this._setupFutureEvents.bind(this));
  },

  _processSessionExpired() {
    return this.beforeSessionExpired()
      .then(this._trySilentAuth.bind(this))
      .then(this._invalidateIfAuthenticated.bind(this), this._scheduleExpire.bind(this)); // reschedule expiration if we re-authenticate.
  },

  _trySilentAuth() {
    if(this.auth0.silentAuthOnSessionExpire) {
      // Try silent auth, but reverse the promise results.
      // since a rejecting promise during expiration means
      // "don't expire", we want to reject on success and
      // resolve on failure. Strange times.
      return new RSVP.Promise((resolve, reject) => {
        this.session.authenticate('authenticator:auth0-silent-auth').then(reject, resolve);
      });
    }
    return RSVP.resolve();
  },

  _invalidateIfAuthenticated() {
    if (this.session.isAuthenticated) {
      this.session.invalidate();
    }
  }
});
