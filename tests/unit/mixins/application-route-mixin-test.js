import { assign } from '@ember/polyfills';
import { run } from '@ember/runloop';
import RSVP from 'rsvp';
import EmberObject, { get } from '@ember/object';
import ApplicationRouteMixinMixin from 'ember-simple-auth-auth0/mixins/application-route-mixin';
import { module } from 'qunit';
import { setupTest } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';

import { freezeDateAt, unfreezeDate } from 'ember-mockdate-shim';
import now from 'ember-simple-auth-auth0/utils/now';

module('Unit | Mixin | application route mixin', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.subject = function(options) {
      options = assign({
        _subscribeToSessionEvents() {
        }
      }, options);

      let ApplicationRouteMixinObject = EmberObject.extend(ApplicationRouteMixinMixin, options);

      this.owner.register('test-container:application-route-mixin-object', ApplicationRouteMixinObject);
      return this.owner.lookup('test-container:application-route-mixin-object');
    };
  });

  test('it sets the correct expiration time if the expiresIn header exists', function(assert) {
    freezeDateAt(new Date('1993-12-10T08:44:00'));

    assert.expect(1);
    const issuedAt = now();
    const subject = this.subject({
      session: {
        isAuthenticated: true,
        data: {
          authenticated: {
            expiresIn: 10,
            issuedAt: issuedAt
          },
        },
      },
    });

    assert.equal(get(subject, '_expiresAt'), issuedAt + 10);
    unfreezeDate();
  });

  test('it sets the correct expiration time if the id token exists', function(assert) {
    freezeDateAt(new Date('1993-12-10T08:44:00'));

    assert.expect(1);
    const issuedAt = now();
    const subject = this.subject({
      session: {
        isAuthenticated: true,
        data: {
          authenticated: {
            expiresIn: 12, // should NOT match
            idTokenPayload: {
              iat: issuedAt,
              exp: issuedAt + 10
            }
          },
        },
      },
    });

    assert.equal(get(subject, '_expiresAt'), issuedAt + 10);
    unfreezeDate();
  });

  test('it does not set the exp time if the user is not authenticated', function(assert) {
    assert.expect(1);
    const subject = this.subject({
      session: {
        isAuthenticated: false,
        data: {
          authenticated: {
            expiresIn: 10,
          },
        },
      },
    });

    assert.equal(get(subject, '_expiresAt'), 0);
  });

  test('it calls the auth0-url-hash authenticator if we have url hash data', function(assert) {
    assert.expect(2);
    const subject = this.subject({
      session: {
        authenticate: this.stub().returns(RSVP.resolve())
      },
      _getUrlHashData: this.stub().returns(RSVP.resolve({
        idToken: 1
      })),
    });

    run(() => subject.beforeModel());

    assert.ok(subject.session.authenticate.calledOnce);
    assert.ok(subject.session.authenticate.calledWith('authenticator:auth0-url-hash', { idToken: 1 }));
  });

  test('it does not call the auth0-url-hash authenticator if we do not have url hash data', function(assert) {
    assert.expect(1);
    const subject = this.subject({
      session: {
        authenticate: this.stub().returns(RSVP.resolve())
      },
      _getUrlHashData: this.stub().returns(RSVP.resolve()),
    });

    run(() => subject.beforeModel());

    assert.notOk(subject.session.authenticate.calledOnce);
  });
});
