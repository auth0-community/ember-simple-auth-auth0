import { currentURL } from '@ember/test-helpers';
import { get } from '@ember/object';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { currentSession, authenticateSession} from 'ember-simple-auth/test-support';
import { mockAuth0Lock } from 'ember-simple-auth-auth0/test-support';
import page from '../../pages/login';

module('Acceptance | login', function(hooks) {
  setupApplicationTest(hooks);

  test('visiting /login goes to login page if unauthenticated', async function(assert) {
    assert.expect(1);
    await page.visit();

    assert.equal(currentURL(), '/login');
  });

  test('visiting /login redirects to /protected page if authenticated', async function(assert) {
    assert.expect(1);
    await page.visit();
    await authenticateSession();

    assert.equal(currentURL(), '/protected');
  });

  test('it mocks the auth0 lock login and logs in the user', async function(assert) {
    assert.expect(2);
    const sessionData = {
      idToken: 1,
      expiresIn: 3600
    };

    await mockAuth0Lock(sessionData);

    await page
      .visit()
      .login();

    let session = currentSession();
    let idToken = get(session, 'data.authenticated.idToken');
    assert.equal(idToken, sessionData.idToken);
    assert.equal(currentURL(), '/protected');
  });

  test('it mocks the auth0 lock login again and logs in a different user', async function(assert) {
    assert.expect(2);
    const sessionData = {
      idToken: 2,
      expiresIn: 3600
    };

    await mockAuth0Lock(sessionData);

    await page
      .visit()
      .login();

    let session = currentSession();
    let idToken = get(session, 'data.authenticated.idToken');
    assert.equal(idToken, sessionData.idToken);
    assert.equal(currentURL(), '/protected');
  });
});
