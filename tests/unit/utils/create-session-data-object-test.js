import { assign } from '@ember/polyfills';
import createSessionDataObject from 'dummy/utils/create-session-data-object';
import {
  module,
  test
} from 'qunit';

import { freezeDateAt, unfreezeDate } from 'ember-mockdate-shim';
import now from 'ember-simple-auth-auth0/utils/now';

module('Unit | Utility | create session data object', function() {
  test('it merges the profile and token info', function(assert) {
    freezeDateAt(new Date('1993-12-10T08:44:00'));
    assert.expect(1);

    const issuedAt = now();

    let profile = {
      my_key: 'foo'
    };

    let tokenInfo = {
      idToken: 'aaa.bbbb.ccc'
    };

    let expectedResult = { issuedAt: issuedAt };
    assign(expectedResult, { profile }, tokenInfo);

    let result = createSessionDataObject(profile, tokenInfo);
    assert.deepEqual(result, expectedResult);
    unfreezeDate();
  });

  test('it merges the profile and token info, ignoring a previous profile attribute', function(assert) {
    freezeDateAt(new Date('1993-12-10T08:44:00'));
    assert.expect(1);

    const issuedAt = now();

    let profile = {
      my_key: 'foo'
    };

    let tokenInfo = {
      idToken: 'aaa.bbbb.ccc',
      profile: { some: 'stuff' }
    };

    let expectedResult = {
      issuedAt: issuedAt,
      idToken: 'aaa.bbbb.ccc',
      profile,
    };

    let result = createSessionDataObject(profile, tokenInfo);
    assert.deepEqual(result, expectedResult);
    unfreezeDate();
  });

  test('it issues a creation timestamp', function(assert) {
    assert.expect(1);

    let profile = {
      my_key: 'foo'
    };

    let tokenInfo = {
      idToken: 'aaa.bbbb.ccc'
    };

    let result = createSessionDataObject(profile, tokenInfo);
    assert.ok(result.issuedAt);
  });
});
