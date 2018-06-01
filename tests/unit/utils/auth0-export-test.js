import {
  test,
  module
} from 'qunit';
import auth0Lock from 'auth0-lock';
import auth0 from 'auth0';

module('Unit | moment exports', function() {
  test('auth0 exports', (assert) => {
    assert.ok(auth0, 'auth0 exports an object');
  });

  test('auth0-lock exports', (assert) => {
    assert.ok(auth0Lock, 'auth0-lock exports an object');
  });
});
