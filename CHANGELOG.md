Changelog
=========

## v2.2.2 (February 10th, 2017)

- [#35](https://github.com/seawatts/ember-simple-auth-auth0/issues/35) **bugfix**: Lock Auth0.js version to ~7.6.x

## v2.2.1 (January 22nd, 2017)

### Pull Requests

- [#33](https://github.com/seawatts/ember-simple-auth-auth0/pull/33) **bugfix**: Fix issue with latest version of auth0-lock  *by [Chris Watts](https://github.com/seawatts/feature)*

## v2.2.0 (December 28th, 2016)

### Pull Requests

- [#23](https://github.com/seawatts/ember-simple-auth-auth0/pull/23) **enhancement**: upgrade dependencies  *by [Chris Watts](https://github.com/seawatts/feature)*
- [#28](https://github.com/seawatts/ember-simple-auth-auth0/pull/28) **enhancement**: Improve ability to show the auth0 lock so that it can be overriden during acceptance tests  *by [Chris Watts](https://github.com/seawatts/feature)*

## v2.1.4 (December 5th, 2016)

### Pull Requests

- [#20](https://github.com/seawatts/ember-simple-auth-auth0/pull/20) **fix**: issue where the session would not be invalided when the token is expired  *by [Chris Watts](https://github.com/seawatts/feature)*

## v2.1.3 (December 5th, 2016)

- [#19](https://github.com/seawatts/ember-simple-auth-auth0/pull/19) **fix:** deprecation warnings to display correctly *by [@seawatts](https://github.com/seawatts)*

## v2.1.2 (November 30th, 2016)

- [#17](https://github.com/seawatts/ember-simple-auth-auth0/pull/17) **fix:** Remove string interpolation *by [@seawatts](https://github.com/seawatts)*

## v2.1.1 (November 30th, 2016)

- [#16](https://github.com/seawatts/ember-simple-auth-auth0/pull/16) **fix:** Don't use es6 feature in index.js *by [@seawatts](https://github.com/seawatts)*

## v2.1.0 (November 18th, 2016)

- [#15](https://github.com/seawatts/ember-simple-auth-auth0/pull/15) **enhancement:** backwards compatibility for data.authenticated block *by [@seawatts](https://github.com/seawatts)*

## v2.0.0 (November 14th, 2016)

**Breaking Changes**

 - The profile that is returned from lock.js getProfile is now scoped under the profile property on the session. See readme for updated session object

## v1.0.3 (November 4th, 2016)

- [#10](https://github.com/seawatts/ember-simple-auth-auth0/pull/10) **fix:** Only run beforeSessionExpire if we are not in testing *by [@seawatts](https://github.com/seawatts)*

## v1.0.2 (November 3rd, 2016)

- [#9](https://github.com/seawatts/ember-simple-auth-auth0/pull/9) **fix:** issue where jwt authorizer wasn't adding the jwt to the block *by [@seawatts](https://github.com/seawatts)*
- Fixed an issue where `ember install` or `ember generate` would fail because `rsvp` was in `devDependencies` instead of `dependencies`

## v1.0.1 (November 3rd, 2016)

- [#8](https://github.com/seawatts/ember-simple-auth-auth0/pull/8) **fix:** issue where after auth would not redirect correctly *by [@seawatts](https://github.com/seawatts)*

## v1.0.0 (November 2nd, 2016)

### Breaking Changes

- The session data object is now unified into one object instead of split between the user profile and the jwt info
```json
{
  "authenticated": {
    "authenticator": "authenticator:auth0-impersonation",
    "email": "foo@bar.com",
    "impersonated": true,
    "impersonator": {
      "user_id": "google-oauth2|108251222085688410292",
      "email": "impersonator@bar.com"
    },
    "appMetadata": {
    },
    "userMetadata": {
    },
    "emailVerified": true,
    "clientID": "YwDY9D433veMHC2e27j2BESjlnwF7ry8",
    "updatedAt": "2016-11-02T23:28:06.864Z",
    "userId": "auth0|da71a38d-3d2a-4281-8dfa-504ed0acd598",
    "identities": [
      {
        "user_id": "da71a38d-3de2-4281-8dfa-504ed0acd598",
        "provider": "auth0",
        "connection": "DB",
        "isSocial": false
      }
    ],
    "createdAt": "2016-04-01T21:03:24.847Z",
    "globalClientId": "I22jtMbdaRIz0pOwPdN2Ciuh2uIdzfy2",
    "accessToken": "OfevAkQ5ar42HA2j",
    "idToken": "aaaa.bbb.cccc",
    "idTokenPayload": {
      "iss": "https://domain.auth0.com/",
      "sub": "auth0|da71a382-3dea-2281-8dfa-204ed0acd598",
      "aud": "Yw2Y9D433veMHCred7j0BESjlnwF7r28",
      "exp": 1478629287,
      "iat": 1478129287
    }
  }
}
```

## Bug Fixes

- beforeExpired would never fire. This is now moved into the application-route-mixin and can be overridden by beforeSessionExpired
- auth0.js and lock.js were not being installed correctly

## Enhancements

- Added ember-simple-auth as a dependency
