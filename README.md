# ember-simple-auth-auth0
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)

[![Build Status](https://travis-ci.org/auth0-community/ember-simple-auth-auth0.svg?branch=master)](https://travis-ci.org/seawatts/ember-simple-auth-auth0)
[![Ember Observer Score](https://emberobserver.com/badges/ember-simple-auth-auth0.svg)](https://emberobserver.com/addons/ember-simple-auth-auth0)
[![npm version](https://badge.fury.io/js/ember-simple-auth-auth0.svg)](https://badge.fury.io/js/ember-simple-auth-auth0)

## NOTICE

The Auth0 Community is in the process of deprecating this library, and the repository will no longer be available on Github after the end-of-life date of **September 30, 2021**. Please make plans to find a suitable replacement or remove this library from any active projects before the end-of-life date. Please reach out in the supporting [Auth0 Community topic](https://community.auth0.com/t/community-repo-deprecations-september-2021-eol/60380) if you have any questions or concerns.

### An ember-cli addon for using [Auth0](https://auth0.com/) with [Ember Simple Auth](https://github.com/simplabs/ember-simple-auth).

Auth0's [Lock](https://github.com/auth0/lock) widget and [Universal Login](https://auth0.com/docs/universal-login) page are nice ways to get a fully functional signup and login workflow into your app. This addon makes it dead simple to add one or the other to your Ember application.

# Table of Contents

**Basic Information**

* [What does it do?](#what-does-it-do)
* [Example App](#example-app)

**Installation**

* [Auth0 Setup](#auth0-setup)
* [Addon Installation](#addon-installation)
* [Configuration](#configuration)
* [Application Route Setup](#application-route-setup)

**Usage**

* [Embedded Lock](#embedded-lock)
* [Passwordless Login](#passwordless-login)
* [Universal Login](#universal-login)

**Feature Guides**

* [Impersonation](#impersonation)
* [Silent Authentication](#silent-authentication)
* [Session Data](#session-data)
* [Handling Errors](#handling-errors)
* [Calling an API](#calling-an-api)

**Migration Guides**

* [Migrating from Ember-Simple-Auth-Auth0 v4.x to v5.x](#migrating-from-ember-simple-auth-auth0-v4x-to-v5x)
  * [Replace JWT Authorizer](#replace-jwt-authorizer)
  * [Replace DataAdapterMixin](#replace-dataadaptermixin)
* [Migrating from Ember-Simple-Auth-Auth0 v3.x to v4.x](#migrating-from-ember-simple-auth-auth0-v3x-to-v4x)
  * [Auth0 Migration Guides](#auth0-migration-guides)
  * [Passwordless Auth Changes](#passwordless-auth-changes)
  * [Impersonation Changes](#impersonation-changes)

**Developing this Addon**

* [Acceptance Testing](#acceptance-testing)
* [Stubbing out the authenticator for testing purposes](#stubbing-out-the-authenticator-for-testing-purposes)
* [Contributing](#contributing)

**License**

* [MIT License](#license)

# Basic Information

## What does it do?

* it wires up Auth0's **Lock.js** and its hosted **Universal Login** to work with Ember Simple Auth.
* it lets you work with **Ember Simple Auth** just like you normally do!

## Example App

This addon ships with a dead simple [dummy app](https://github.com/auth0-community/ember-simple-auth-auth0/tree/develop/tests/dummy/app) that can be used as a template for starting new projects. Alternatively, this readme details how to get it up and running from scratch, and details some more advanced features and use cases.

# Installation

## Auth0 Setup

If you don't already have an account, go sign up at [Auth0](https://auth0.com/) for free, then:

1. Create a new app through your dashboard.
2. Add `http://localhost:4200` to your Allowed Callback URLs through your dashboard
3. If you wish to use a hosted login page (i.e. Universal Login), enable it through your dashboard
4. That's it!

## Addon Installation

To use this addon, simply install it with ember-cli:

```bash
ember install ember-simple-auth-auth0
```

All dependencies such as Auth0.js, Lock, and ember-simple-auth will be pulled in automatically, so that's it!

## Configuration

In your `config/environment.js` file, provide the following properties:

1. (REQUIRED) - _clientID_ - Get this from your [Auth0 Dashboard](https://manage.auth0.com/#/clients)
2. (REQUIRED) - _domain_ - Get this from your [Auth0 Dashboard](https://manage.auth0.com/#/clients)
3. (OPTIONAL) - _logoutReturnToURL_ - This can be overridden if you have a different logout callback than the login page.
4. (OPTIONAL) - _enableImpersonation_ - Enables user impersonation. False by default.
5. (OPTIONAL) - _silentAuth__ - A hash of options for configuring [Silent Authentication](#silent-authentication) -- see the linked doc section for more details.

An example configuration might look something like:

```js
// config/environment.js
module.exports = function(environment) {
  let ENV = {
    'ember-simple-auth': {
      authenticationRoute: 'login',
      auth0: {
        clientID: '<client_id>',
        domain: '<your_domain>.auth0.com',
        logoutReturnToURL: '/logout',
        enableImpersonation: false,
        silentAuth: {
          // Silent authentication is off by default.
          // See 'Silent Authentication' section in this
          // readme for a list of options that go here.
        }
      }
    }
  };

  return ENV;
};
```

If you are using [content security policy](http://www.html5rocks.com/en/tutorials/security/content-security-policy/) to manage which resources are allowed to be run on your pages, add the following CSP rules:

```js
// config/environment.js

  ENV.contentSecurityPolicy = {
    'font-src': "'self' data: https://*.auth0.com",
    'style-src': "'self' 'unsafe-inline'",
    'script-src': "'self' 'unsafe-eval' https://*.auth0.com",
    'img-src': '*.gravatar.com *.wp.com data:',
    'connect-src': "'self' http://localhost:* https://your-app-domain.auth0.com"
  };

```

## Application Route Setup

In your application route, be sure to import ApplicationRouteMixin **from this addon** (i.e. not the one that ships with Ember Simple Auth), or else things like session expiration will not work correctly.

```js
// app/routes/application.js

import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import ApplicationRouteMixin from 'ember-simple-auth-auth0/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  beforeSessionExpired() {
    // Do custom async logic here, e.g. notify
    // the user that they are about to be logged out.

    return RSVP.resolve();
  }

  // Do other application route stuff here. All hooks provided by
  // ember-simple-auth's ApplicationRouteMixin, e.g. sessionInvalidated(),
  // are supported and work just as they do in basic ember-simple-auth.
});
```

# Usage

## Embedded Lock

To use the embedded Lock widget, in your application controller, or wherever else you wish to do authentication (e.g. a '/login' route+controller), inject the session service and use the `auth0-lock` authenticator, like so:

```js
// app/controllers/application.js

import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  actions: {
    login () {
      // Check out Auth0 Lock's documentation for all the options:
      // https://auth0.com/docs/libraries/lock/customization
      const lockOptions = {
       auth: {
         params: {
           scope: 'openid email profile'
         }
       }
      };

      this.session.authenticate('authenticator:auth0-lock', lockOptions);
    },

    logout () {
      this.session.invalidate();
    }
  }
});
```

```hbs
{{!-- app/templates/application.hbs --}}

{{#if session.isAuthenticated}}
  <div>
    You are currently logged as: {{session.data.authenticated.profile.email}}
  </div>
  <a href="" {{ action "logout" }}>Logout</a>
{{else}}
  <a href="" {{ action "login" }}>Login</a>
{{/if}}
```

When the `login` action above is fired, the Lock widget is created using the options passed to the `authenticate` function. Refer to [Auth0's documentation](https://auth0.com/docs/libraries/lock/customization) for notes on how to set up Lock itself -- all options are passed through to Lock as-is.

## Passwordless Login

To perform passwordless login, use the `auth0-lock-passwordless` authenticator. That's it!

For more information on how to set up Passwordless authentication server side and how to configure the Lock, see the following official guides:

* [Using Passwordless Authentication](https://auth0.com/docs/connections/passwordless) (server-side setup)
* [Passwordless Options](https://auth0.com/docs/libraries/lock/v11#passwordless-options) for Lock

An example might look like this:

```js
// app/controllers/application.js

import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  actions: {
    login () {
      // Check out the docs for all the options:
      // https://github.com/auth0/lock-passwordless#customization
      const lockOptions = {
       allowedConnections: ['email'],
       passwordlessMethod: 'link',
       authParams: {
         scope: 'openid email profile'
       }
      };

      this.session.authenticate('authenticator:auth0-lock-passwordless', lockOptions, (err, email) => {
        console.log(`Email link sent to ${email}!`)
      });
    },

    logout () {
      this.session.invalidate();
    }
  }
});
```

Note that you can pass in a callback as the last argument to handle events after a passwordless link has been sent.

## Universal Login

To use Auth0's [Universal Login](https://auth0.com/docs/universal-login) workflow (i.e. an Auth0-hosted login page), use the `auth0-universal` authenticator. This will redirect the user to the hosted login page (just be sure to set this up on the server through your Auth0 dashboard first).

Behind the scenes, the authenticator calls Auth0.js's [authorize](https://auth0.com/docs/libraries/auth0js/v9#webauth-authorize-) method, so see the linked docs for a full list of supported options.

An example:

```js
// app/controllers/application.js

import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  actions: {
    login () {
      // Check out the docs for all the options:
      // https://auth0.com/docs/libraries/auth0js/v9#webauth-authorize-
      const authOptions = {
        responseType: 'token',
        scope: 'openid email profile'
      };

      this.session.authenticate('authenticator:auth0-universal', authOptions, (err, email) => {
        console.log(`Email link sent to ${email}!`)
      });
    },

    logout () {
      this.session.invalidate();
    }
  }
});
```

# Feature Guides

## Impersonation

This addon contains native impersonation support. Just follow the instructions on [Auth0's documentation](https://auth0.com/docs/user-profile/user-impersonation) and you will be logged in.

Note that before you can use impersonation, you must **enable it in your app configuration** -- see the [Configuration](#configuration) section above.

The new session object will include the following fields:

```json
{
  "authenticated": {
    "authenticator": "authenticator:auth0-url-hash",
    //...
    "profile": {
      "impersonated": true,
      "impersonator": {
        "user_id": "google-oauth2|108251222085688410292",
        "email": "impersonator@bar.com"
      }
    }
    //...
  }
}
```

## Silent Authentication

Since version 4.2.0, this addon supports automatic [Silent Authentication](https://auth0.com/docs/api-auth/tutorials/silent-authentication), a.k.a. the ability to automatically refresh session tokens upon (or before) expiration.

Automatic silent authentication enabled in the app's environment configuration file; next to the rest of thea auth0 config options, simply provide a `silentAuth` object with the following:

1. (OPTIONAL) - _renewSeconds_ - If set, the token will be renewed on a timer, every specified number of seconds.
2. (OPTIONAL) - _onSessionRestore_ - If `true`, the token will be renewed when trying to restore an expired session token on app load.
3. (OPTIONAL) - _onSessionExpire_ - If `true`, the token will be renewed when the active session token expires during app use.
4. (REQUIRED) - _options_ - A hash of options to pass to [checkSession](https://auth0.com/docs/libraries/auth0js/v9#using-checksession-to-acquire-new-tokens), the function which performs Silent Authentication behind the scenes. See linked docs for details on what these options can be.

Although the first 3 parameters are technically optional, at least one of them needs to be set for anything to happen, naturally.

A typical example might look like the following:

```js
// config/environment.js
module.exports = function(environment) {
  let ENV = {
    'ember-simple-auth': {
      // ...

      auth0: {
        // ...

        silentAuth: {

          // automatically renew token every 30 minutes:
          renewSeconds: 1800,

          // automatically renew token when trying to restore an expired session (on app load):
          onSessionRestore: true,

          // automatically renew token when token expiration time is hit (during app use):
          onSessionExpire: true,

          // options to pass to checkSession when doing automatic silent auth.
          // The redirectUri parameter is automatically set to window.location.origin
          // if not specified.
          options: {
            responseType: 'token id_token',
            scope: 'openid profile email',
            timeout: 5000
          }
        }
      }
    }
  };

  return ENV;
};
```

In addition to the above, an `auth0-silent-auth` authenticator is provided in case you have a particular custom hook in your application you wish to trigger a token refresh from, but this is a rather advanced use case that most users won't need to mess with.

## Session Data

After the user has been authenticated, `session.data.authenticated` is filled with the data returned by Auth0. What gets stored here is dependent on the `scope` property in your authentication options; for instance, this is what the session object looks like with `scope` set to "openid email profile" (sans the placeholders in \<angle brackets\>, which are filled with real data during actual use):

__Note: all keys coming back from auth0 are transformed to camelcase for consistency__

```json
{
  "authenticated": {
    "authenticator": "authenticator:auth0-lock",
    "accessToken": "<access_token>",
    "idToken": "<id_token>",
    "idTokenPayload": {
      "iss": "https://<your_domain>.auth0.com/",
      "sub": "auth0|<user_id>",
      "aud": "<client_id>",
      "iat": 1521131759,
      "exp": 1521167759
    },
    "appState": null,
    "refreshToken": null,
    "state": "<state>",
    "expiresIn": 86400,
    "tokenType": "Bearer",
    "scope": "openid email profile",
    "profile": {
      "email": "bob.johnson@domain.com",
      "picture": "https://s.gravatar.com/avatar/aaafe9b3923266eacb178826a65e92d1?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatar2%2Fcw.png",
      "nickname": "bob.johnson",
      "name": "bob.johnson@domain.com",
      "last_password_reset": "2018-03-11T18:03:13.291Z",
      "email_verified": true,
      "user_id": "auth0|<user_id>",
      "clientID": "<client_id>",
      "identities": [
        {
          "user_id": "<user_id>",
          "provider": "auth0",
          "connection": "<connection_id>",
          "isSocial": false
        }
      ],
      "updated_at": "2018-03-15T16:35:59.036Z",
      "created_at": "2016-11-09T22:43:53.994Z",
      "sub": "auth0|<user_id>"
    }
  }
}
```

You can use this in your templates that have the session service injected, like so:

```hbs
My logged in user email is {{session.data.authenticated.profile.email}}!
```

## Handling Errors

Errors come back as a hash in the URL. These will be automatically parsed and Ember will transition to the error route with two variables set on the model: `error` and `errorDescription`. A quick example:

```ember g template application-error```

```hbs
// app/templates/application-error.hbs

Encountered an error from auth0 - {{model.error}} -- {{model.errorDescription}}
```

## Calling an API

The plugin `ember-simple-auth` provides the `authorize` hook to add the token of the user to the headers of the API request.

See [server](./server) for an example of an express application getting called by the ember app.

An example using [ember-data](https://github.com/emberjs/data):

`ember g adapter application`

```js
import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';
import { isPresent } from '@ember/utils';
import { debug } from '@ember/debug';

export default JSONAPIAdapter.extend(DataAdapterMixin, {
  authorize(xhr){
    const { idToken } = this.get('session.data.authenticated');
    if (isPresent(idToken)) {
      xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
    } else {
      debug('Could not find the authorization token in the session data.');
    }
  }
});
```

```js
// app/routes/application.js

import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth-auth0/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  model() {
    return this.store.findAll('my-model');
  }
});
```

This will make the following request

```js
GET
http://localhost:4200/my-model

Accept: application/vdn+json-api
Authorization: Bearer 123.123123.1231
```

To make an API request without ember-data, add the user's [JWT token](/jwt) to an `Authorization` HTTP header:

```js
fetch('/api/foo', {
  method: 'GET',
  cache: false,
  headers: {
    'Authorization': `Bearer ${session.data.authenticated.jwt}`
  }
}).then(function (response) {
  // use response
});
```

# Migration Guides

## Migrating from ember-simple-auth-auth0 v4.x to v5.x

The major breaking change in 5.x is the removal of the `jwt` authorizer. Ember Simple Auth has [deprecated authorizers](https://github.com/simplabs/ember-simple-auth#deprecation-of-authorizers) and will be removing them in a future release, so this addon has followed suit for futureproofing's sake.

### Replace JWT Authorizer

If you're directly using the `jwt` authorizer through the session service, like so:

```js
// app/controllers/something.js

import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  actions: {
    doSomething () {
      // ...
      this.session.authorize('authorizer:jwt', (headerName, headerValue) => {
        // ...do something with the header.
      });
      // ...
    }
  }
});
```

Either construct an Authentication header from `session.data.authenticated` as shown in the [Calling an API](#calling-an-api) guide above, or just inject the `auth0` service and call the `authorize` method, like so:

```js
// app/controllers/something.js

import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  auth0: service(),
  actions: {
    doSomething () {
      // ...
      this.auth0.authorize((headerName, headerValue) => {
        // ...do something with the header.
      });
      // ...
    }
  }
});
```

The `auth0.authorize` method is nearly the same as `session.authorize`, but there's one less parameter since you no longer have to specify an authorizer type.

### Replace DataAdapterMixin

If you're currently Ember Simple Auth's DataAdapterMixin along with the `jwt` authorizer to make ember-data work, this addon includes a replacement Auth0DataAdapterMixin that does this for you:

```js
// app/adapters/application.js
import JSONAPIAdapter from 'ember-data/adapters/json-api';
import Auth0DataAdapterMixin from 'ember-simple-auth-auth0/mixins/auth0-data-adapter-mixin';

export default JSONAPIAdapter.extend(Auth0DataAdapterMixin, {
  // customizer your adpater further here, if you wish.
});
```

Note that this is functionally equivalent to customizing the adapter as shown in the [Calling an API](#calling-an-api) guide above. The guides in the main sections of this README use the methodology recommended by Ember Simple Auth (that is, constructing a header directly) rather than use these shortcut functions/mixins, but they're effectively the same. It's a matter of taste and convenience, mostly.

## Migrating from ember-simple-auth-auth0 v3.x to v4.x

Starting from version 4.0.0, this addon uses Lock v11, which now supports Passwordless functionality
among other things. As such, there are a few breaking changes to consider for users coming from v3.x

### Auth0 Migration Guides

First and foremost, take a look at the following guides from Auth0; these cover most of the requirements:
* [Migrating from Lock v10 to v11](https://auth0.com/docs/libraries/lock/v11/migration-v10-v11)
* [Migration Guide for lock-passwordless to Lock v11 with Passwordless Mode](https://auth0.com/docs/libraries/lock/v11/migration-lock-passwordless)
 
### Passwordless Auth Changes

For those using this addon with Passwordless authentication, the API for the
`auth0-lock-passwordless` authenticator has changed.

The major **breaking change** is that the "type" parameter for the `auth0-lock-passwordless`
authenticator is gone. Instead, set the `passwordlessMethod` and `allowedConnections` options
in the options hash:

```js
// app/controllers/application.js

import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  actions: {

    // OLD method of invoking passwordless auth (v3.x):

    loginOld () {
      const lockOptions = {
       authParams: {
         scope: 'openid email profile'
       }
      };

      this.session.authenticate('authenticator:auth0-lock-passwordless', 'magiclink', lockOptions, (err, email) => {
        console.log(`Email link sent to ${email}!`)
      });
    },

    // NEW method of invoking passwordless auth (v4.x):

    loginNew () {
      const lockOptions = {
       allowedConnections: ['email'],
       passwordlessMethod: 'link',
       authParams: {
         scope: 'openid email profile'
       }
      };

      this.session.authenticate('authenticator:auth0-lock-passwordless', lockOptions, (err, email) => {
        console.log(`Email link sent to ${email}!`)
      });
    },

    logout () {
      this.session.invalidate();
    }
  }
});
```

The good news here is that the `auth0-lock-passwordless` authenticator works exactly
like `auth0-lock`; no more subtle differences.

On the off-chance your Ember app is calling the `showPasswordlessLock` method of the
`auth0` service directly, its `type` parameter has similarly been removed. The
process of converting `type` to `options` is the same as above.

See the [Initialization options](https://auth0.com/docs/libraries/lock/v11/migration-lock-passwordless#using-npm-module-bundler#initialization-options)
section of Auth0's Passwordless migration guide for more details, though the above
advice should hopefully suffice.

### Impersonation Changes

User impersonation is [disabled by default](https://github.com/auth0/auth0.js/issues/683)
in newer versions of Auth0.js (and consequently, this addon starting from v4.0.0). To
enable it, you'll need to set the `enableImpersonation` flag in your app's
`config/environment.js`, like so:

```js
// config/environment.js
module.exports = function(environment) {
  let ENV = {
    'ember-simple-auth': {
      authenticationRoute: 'login',
      auth0: {
        clientID: '1234',
        domain: 'my-company.auth0.com',
        logoutReturnToURL: '/logout',
        enableImpersonation: true
      }
    }
  };

  return ENV;
};
```

Be warned that enabling impersonation has security trade-offs, so use with caution.

# Developing this Addon

## Acceptance Testing

If you want to craft acceptance tests for Auth0's Lock, there are two things you can do:

- If you are just using the default auth0-lock authenticator then all you have to do is authenticateSession.
- If you are manually invoking the auth0 lock you should use the `showLock` function on the auth0 service and then call `mockAuth0Lock` in your test.

```js
// tests/acceptance/login.js

import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { mockAuth0Lock } from 'ember-simple-auth-auth0/test-support';
import { authenticateSession, currentSession } from 'ember-simple-auth/test-support';

module('Acceptance | login', function(hooks) {
  setupApplicationTest(hooks);
  
  test('visiting /login redirects to /protected page if authenticated', async function(assert) {
    assert.expect(1);
    const sessionData = {
      idToken: 1
    };

    await authenticateSession(sessionData);
    await visit('/login');
    
    let session = currentSession(this.application);
    let idToken = get(session, 'data.authenticated.idToken');
    assert.equal(idToken, sessionData.idToken);
    assert.equal(currentURL(), '/protected');
  });

  test('it mocks the auth0 lock login and logs in the user', async function(assert) {
    assert.expect(1);
    const sessionData = {
      idToken: 1
    };

    await mockAuth0Lock(sessionData);
    await visit('/login');

    assert.equal(currentURL(), '/protected');
  });
  
});
```

## Stubbing out the authenticator for testing purposes

If you want to replace the authenticator (e.g. for testing purposes), here is a
minimal example. The mock JWT in this example is in `window.mockJwt` and is
generated by the backend in a fullstack testing environment.

```javascript

import { resolve, Promise } from 'rsvp';
import Base from 'ember-simple-auth/authenticators/base';

export default Base.extend({
  restore(data) {
    return resolve(data);
  },
  authenticate() {
    return new Promise((res) => {
      const idToken = window.mockJwt;
      const sessionData =  {
        idToken,
        expiresIn: 60 * 60, // one hour is more than enough for one test case
        idTokenPayload: {
          // 'iat' is short for 'issued at' in seconds
          iat: Math.ceil(Date.now() / 1000),
        }
      };
      res(sessionData);
    });
  },
});
```

The [application route mixin](addon/mixins/application-route-mixin.js) of this
plugin expects the two values `idTokenPayload.iat` and `expiresIn` to be present
in the session data. If you don't provide these two values, your session will
expire immediately.

## Contributing

### Cloning

* `git clone` this repository
* `cd ember-simple-auth-auth0`
* `npm install`

### Running

* Set the environment variable `AUTH0_CLIENT_ID_ID={Your account id}`
* Set the environment variable `AUTH0_DOMAIN={Your account domain}`
* Grab from your those from the [Auth0 Dashboard](https://manage.auth0.com/#/clients)
* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`


### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions


For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

# License

This project is licensed under the [MIT License](LICENSE.md).

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://twitter.com/maskedwarrior"><img src="https://avatars1.githubusercontent.com/u/631691?v=4" width="100px;" alt="Miguel Andrade"/><br /><sub><b>Miguel Andrade</b></sub></a><br /><a href="#maintenance-miguelcobain" title="Maintenance">🚧</a> <a href="#review-miguelcobain" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/auth0-community/ember-simple-auth-auth0/commits?author=miguelcobain" title="Code">💻</a></td>
  </tr>
</table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!