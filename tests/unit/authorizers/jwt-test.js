import JWTAuthorizer from 'ember-simple-auth-auth0/authorizers/jwt';
import {
  module
} from 'qunit';
import test from 'ember-sinon-qunit/test-support/test';

module('Unit | Authorizer | jwt', function(hooks) {
  hooks.beforeEach(function() {
    this.subject = function() {
      return JWTAuthorizer.create();
    };
  });

  test('it adds the Authorization Bearer token to the block if we are using idToken key', function(assert) {
    let block = this.spy();
    let sessionData = {
      idToken: 'aaa.bbb.ccc'
    };

    let authorizer = this.subject();

    authorizer.authorize(sessionData, block);

    assert.ok(block.calledWith('Authorization', `Bearer ${sessionData.idToken}`));
  });
});
