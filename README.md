# ember-simple-auth-auth0

[![Build Status](https://travis-ci.org/auth0-community/ember-simple-auth-auth0.svg?branch=master)](https://travis-ci.org/seawatts/ember-simple-auth-auth0)
[![Ember Observer Score](https://emberobserver.com/badges/ember-simple-auth-auth0.svg)](https://emberobserver.com/addons/ember-simple-auth-auth0)
[![npm version](https://badge.fury.io/js/ember-simple-auth-auth0.svg)](https://badge.fury.io/js/ember-simple-auth-auth0)

### An ember-cli addon for using [Auth0](https://auth0.com/) with [Ember Simple Auth](https://github.com/simplabs/ember-simple-auth).

Auth0's [Lock](https://github.com/auth0/lock) widget is a nice way to get a fully functional signup and login workflow into your app.

## What does it do?

* Wires up Auth0's Lock.js to work with Ember Simple Auth.
* Lets you work with Ember Simple Auth just like you normally do!

### Auth0

If you don't already have an account, go sign up at for free: [Auth0](https://auth0.com/)

1. Create a new app through your dashboard.
2. Add `http://localhost:4200` to your Allowed Callback URLs through your dashboard
3. Done!

## Installation

Install this addon with ember-cli:
```ember install ember-simple-auth-auth0```

## Global Configuration

**In your `config/environment.js` file, you must provide the following properties**

1. (REQUIRED) - _clientID_ - Grab from your [Auth0 Dashboard](https://manage.auth0.com/#/clients)
2. (REQUIRED) - _domain_ - Grab from your [Auth0 Dashboard](https://manage.auth0.com/#/clients)
3. (OPTIONAL) - _logoutReturnToURL_ - This can be overridden if you have a different logout callback than the login page.
4. (OPTIONAL) - _enableImpersonation_ - Enables user impersonation. False by default.
The logoutURL that is actually gets used is constructed as follows:

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
        enableImpersonation: false
      }
    }
  };

  return ENV;
};
```

### Suggested security config

> If you are still using [content security policy](http://www.html5rocks.com/en/tutorials/security/content-security-policy/) to manage which resources are allowed to be run on your pages. Please add the following CSP rule.

```js
// config/environment.js

ENV['contentSecurityPolicy'] = {
    'font-src': "'self' data: https://*.auth0.com",
    'style-src': "'self' 'unsafe-inline'",
    'script-src': "'self' 'unsafe-eval' https://*.auth0.com",
    'img-src': '*.gravatar.com *.wp.com data:',
    'connect-src': "'self' http://localhost:* https://your-app-domain.auth0.com"
  };

```

## Data object on the session

The following is what the session object looks like after the user has been authenticated (sans the placeholders in <angle brackets>, which are filled with real data during actual use).

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
    "scope": "openid user_metadata",
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

__You can use this in your templates that have the session service injected.__

```html
My logged in user email is {{session.data.authenticated.profile.email}}!
```

## Impersonation

> This addon supports native impersonation support. Just follow the instructions on Auth0's documentation and you will be logged in.

https://auth0.com/docs/user-profile/user-impersonation

__The new session object will include the following fields__

```json
{
  "authenticated": {
    "authenticator": "authenticator:auth0-url-hash",
    ...
    "profile": {
      "impersonated": true,
      "impersonator": {
        "user_id": "google-oauth2|108251222085688410292",
        "email": "impersonator@bar.com"
      }
    }
    ...
  }
}
```

## Example
__Here is an example application route:__

```js
// app/routes/application.js

import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth-auth0/mixins/application-route-mixin';

const {
  Route,
  RSVP
} = Ember;

export default Route.extend(ApplicationRouteMixin, {
  beforeSessionExpired() {
    // Do async logic
    // Notify the user that they are about to be logged out.

    return RSVP.resolve();
  }
});

```

__Add the session service to your application controller:__

```js
// app/controllers/application.js

import Ember from 'ember';

const {
  Controller,
  inject: {
    service
  },
  get
} = Ember;

export default Controller.extend({
  session: service(),
  actions: {
    login () {
      // Check out the docs for all the options:
      // https://auth0.com/docs/libraries/lock/customization
      const lockOptions = {
       auth: {
         params: {
           scope: 'openid user_metadata'
         }
       }
      };

      get(this, 'session').authenticate('authenticator:auth0-lock', lockOptions);
    },

    logout () {
      get(this, 'session').invalidate();
    }
  }
});
```

```html
// app/templates/application.hbs

{{#if session.isAuthenticated}}
  <div>
    You are currently logged as: {{session.data.authenticated.profile.email}}
  </div>
  <a href="" {{ action "logout" }}>Logout</a>
{{else}}
  <a href="" {{ action "login" }}>Login</a>
{{/if}}
```

# Passwordless

To perform passwordless login, use the `auth0-lock-passwordless` authenticator. That's it!

For more information on how to set up Passwordless auth server side and how to configure the Lock, see the following official guides:

* [Using Passwordless Authentication](https://auth0.com/docs/connections/passwordless) (server-side setup)
* [Passwordless Options](https://auth0.com/docs/libraries/lock/v11#passwordless-options) for Lock

## Example

```js
// app/controllers/application.js

import Ember from 'ember';

const {
  Controller,
  inject: {
    service
  },
  get
} = Ember;

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
         scope: 'openid user_metadata'
       }
      };

      get(this, 'session').authenticate('authenticator:auth0-lock-passwordless', lockOptions, (err, email) => {
        console.log(`Email link sent to ${email}!`)
      });
    },

    logout () {
      get(this, 'session').invalidate();
    }
  }
});
```

Note that you can pass in a callback as the last argument to handle events after a passwordless link has been sent.

# Acceptance Testing

If you want to craft acceptance tests for Auth0's Lock, there are two things you can do:

- If you are just using the default auth0-lock authenticator then all you have to do is authenticateSession.
- If you are manually invoking the auth0 lock you should use the `showLock` function on the auth0 service and then call `mockAuth0Lock` in your test.

```js
// tests/acceptance/login.js

import { test } from 'qunit';
import { mockAuth0Lock } from 'dummy/tests/helpers/ember-simple-auth-auth0';
import { authenticateSession, currentSession } from 'dummy/tests/helpers/ember-simple-auth';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | login');

test('visiting /login redirects to /protected page if authenticated', function(assert) {
  assert.expect(1);
  const sessionData = {
    idToken: 1
  };

  authenticateSession(this.application, sessionData);
  visit('/login');
  andThen(() => {
    let session = currentSession(this.application);
    let idToken = get(session, 'data.authenticated.idToken');
    assert.equal(idToken, sessionData.idToken);
    assert.equal(currentURL(), '/protected');
  });
});

test('it mocks the auth0 lock login and logs in the user', function(assert) {
  assert.expect(1);
  const sessionData = {
    idToken: 1
  };

  mockAuth0Lock(this.application, sessionData);
  visit('/login');

  andThen(() => {
    assert.equal(currentURL(), '/protected');
  });
});
```

## Handling errors

Errors come back as a hash in the URL. These will be automatically parsed and ember will transition to the error route with two variables set on the model: `error` and `errorDescription`. A quick example:

```ember g template application-error```

```hbs
// app/templates/application-error.hbs

Encountered an error from auth0 - {{model.error}} -- {{model.errorDescription}}
```

## Calling an API

Use the `jwt` authorizer to get the user's token for API-calling purposes.

See [server](./server) for an example of an express application getting called by the ember app.

An example using [ember-data](https://github.com/emberjs/data):

`ember g adapter application`

```js
import Ember from 'ember';
import DS from 'ember-data';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';

const {
  computed
} = Ember;

const {
  JSONAPIAdapter
} = DS;

export default JSONAPIAdapter.extend(DataAdapterMixin, {
  authorizer: 'authorizer:jwt',
});

```

```js
// app/routes/application.js

import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth-auth0/mixins/application-route-mixin';

const {
  Route,
  RSVP
} = Ember;

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
    'Authorization': 'Bearer <%= "${session.data.authenticated.jwt}" %>'
  }
}).then(function (response) {
  // use response
});
```

### Stubbing out the authenticator for testing purposes

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


# Migrating from Ember-Simple-Auth-Auth0 v3.x.

Starting from version 4.0.0, this addon uses Lock v11, which now supports Passwordless functionality among other things. As such, there are a few breaking changes to consider for users coming from v3.x

## Auth0 Migration Guides

First and foremost, take a look at the following guides from Auth0; these cover most of the requirements:
* [Migrating from Lock v10 to v11](https://auth0.com/docs/libraries/lock/v11/migration-v10-v11)
* [Migration Guide for lock-passwordless to Lock v11 with Passwordless Mode](https://auth0.com/docs/libraries/lock/v11/migration-lock-passwordless)
 
## Passwordless Auth Changes

For those using this addon with Passwordless authentication, the API for the `auth0-lock-passwordless` authenticator has changed.

The major **breaking change** is that the "type" parameter for the `auth0-lock-passwordless` authenticator is gone. Instead, set the `passwordlessMethod` and `allowedConnections` options in the options hash:

```js
// app/controllers/application.js

import Ember from 'ember';

const {
  Controller,
  inject: {
    service
  },
  get
} = Ember;

export default Controller.extend({
  session: service(),
  actions: {

    // OLD method of invoking passwordless auth (v3.x):

    loginOld () {
      const lockOptions = {
       authParams: {
         scope: 'openid user_metadata'
       }
      };

      get(this, 'session').authenticate('authenticator:auth0-lock-passwordless', 'magiclink', lockOptions, (err, email) => {
        console.log(`Email link sent to ${email}!`)
      });
    },

    // NEW method of invoking passwordless auth (v4.x):

    loginNew () {
      const lockOptions = {
       allowedConnections: ['email'],
       passwordlessMethod: 'link',
       authParams: {
         scope: 'openid user_metadata'
       }
      };

      get(this, 'session').authenticate('authenticator:auth0-lock-passwordless', lockOptions, (err, email) => {
        console.log(`Email link sent to ${email}!`)
      });
    },

    logout () {
      get(this, 'session').invalidate();
    }
  }
});
```

The good news here is that the `auth0-lock-passwordless` authenticator works exactly like `auth0-lock`; no more subtle differences.

On the off-chance your Ember app is calling the `showPasswordlessLock` method of the `auth0` service directly, its `type` parameter has similarly been removed. The process of converting `type` to `options` is the same as above.

See the [Initialization options](https://auth0.com/docs/libraries/lock/v11/migration-lock-passwordless#using-npm-module-bundler#initialization-options) section of Auth0's Passwordless migration guide for more details, though the above advice should hopefully suffice.

## Impersonation

User impersonation is [disabled by default](https://github.com/auth0/auth0.js/issues/683) in newer versions of Auth0.js (and consequently, this addon starting from v4.0.0). To enable it, you'll need to set the `enableImpersonation` flag in your app's `config/environment.js`, like so:

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

# Contributing

## Cloning

* `git clone` this repository
* `cd ember-simple-auth-auth0`
* `npm install`

## Running

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

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
