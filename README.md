# ember-simple-auth-auth0

[![Build Status](https://travis-ci.org/auth0-community/ember-simple-auth-auth0.svg?branch=master)](https://travis-ci.org/seawatts/ember-simple-auth-auth0)
[![Ember Observer Score](https://emberobserver.com/badges/ember-simple-auth-auth0.svg)](https://emberobserver.com/addons/ember-simple-auth-auth0)
[![npm version](https://badge.fury.io/js/ember-simple-auth-auth0.svg)](https://badge.fury.io/js/ember-simple-auth-auth0)

### An ember-cli addon for using [Auth0](https://auth0.com/) with [Ember Simple Auth](https://github.com/simplabs/ember-simple-auth).

Auth0's [lock](https://github.com/auth0/lock) widget, is a nice way to get a fully functional signup and login workflow into your app.

## What does it do?

* Wires up Auth0's Lock.js to work with ember simple auth.
* Lets you work with ember simple auth just like you normally do!

### Auth0

If you don't already have an account, go signup at for free: [Auth0](https://auth0.com/)

1. Create a new app through your dashboard.
2. Add `http://localhost:4200` to your Allowed Callback URLs through your dashboard
3. Done!

__If you are using Auth0.js > 8.x.x make sure to use JsonWebToken Signature Algorithm RS256 in your `Clients` settings under the `Advanced Settings -> OAuth` tab.

## Installation

**Install this addon with ember-cli** `ember install ember-simple-auth-auth0`

## Global Configuration

**In your `config/environment.js` file, you must provide the following properties**

1. (REQUIRED) - _clientID_ - Grab from your [Auth0 Dashboard](https://manage.auth0.com/#/clients)
2. (REQUIRED) - _domain_ - Grab from your [Auth0 Dashboard](https://manage.auth0.com/#/clients)
3. (OPTIONAL) - _logoutReturnToURL_ - This can be overridden if you have a different logout callback than the login page.
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

The following is what the session object looks like after the user has been authenticated.

__Note: all keys coming back from auth0 are transformed to camelcase for consistency__

```json
{
  "authenticated": {
    "authenticator": "authenticator:auth0-lock",
    "profile": {
      "email": "bob@simplymeasured.com",
      "app_metadata": {
        "is_sm_admin": true,
        "api_access": true,
        "sm3_eligible": true
      },
      "user_metadata": {
        "profile_image": "https://s.gravatar.com/avatar/aaafe9b3923266eacb178826a65e92d1?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatar2%2Fcw.png",
        "email": "bob@domain.com",
        "first_name": "bob",
        "last_name": "johnson"
      },
      "email_verified": true,
      "clientID": "Yw2Y9D433veMHCred7j0BESjlnwF7ry8",
      "updated_at": "2016-11-15T00:49:16.663Z",
      "user_id": "auth0|0ca04c34-2247-40f9-b918-292a4bab8995",
      "identities": [
        {
          "user_id": "0bc04c32-2247-40f9-b918-292a4bab8995",
          "provider": "auth0",
          "connection": "social",
          "isSocial": false
        }
      ],
      "created_at": "2016-03-29T18:47:22.112Z",
      "global_client_id": "IW1j1MbdaRIz0pOwPdN2Ciuh2uIdzfyQ"
    },
    "accessToken": "BS72xWcch5x2KZQu",
    "idToken": "eyJ0eXAiOiJKV1Q1LCJhbGciOiJIUzI1NiJ9.1yJpc3MiOiJodHRwczovL3NpbXBseW1lYXN1cmVkLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHwwYmEwNGMzNC0yMjQ3LTQwZjktYjkxOC0yOTJhNGJhYjg5OTUiLCJhdWQiOiJZd0RZOUQ0MzN2ZU1IQ3JlZDdqMEJFU2psbndGN3J5OCIsImV4cCI6MTQ3OTY3MDk1NywiaWF0IjoxNDc5MTcwOTU3fQ.JFHqL1GElPgY86ujjECXX3TOYjiTiIn-tXB1AV0-j2s",
    "idTokenPayload": {
      "iss": "https://domain.auth0.com/",
      "sub": "auth0|0ba01134-2247-40f9-b918-292a4bab8995",
      "aud": "YwDY9D431v1MHCred7j0BESjlnwF7ry8",
      "exp": 1479670957,
      "iat": 1479170957
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

__In order to perform passwordless login you need to use *authenticator:auth0-lock-passwordless* and pass in one of the valid passwordless types.__

### Passwordless Types

* sms
* emailcode
* magiclink
* socialOrMagiclink

### Customization

To see a list of options that can be used with the passwordless authenticator please see [auth0-lock-passwordless repo](https://github.com/auth0/lock-passwordless#customization)

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
       authParams: {
         scope: 'openid user_metadata'
       }
      };

      get(this, 'session').authenticate('authenticator:auth0-lock-passwordless', 'magiclink', lockOptions, (err, email) => {
        console.log(`Email link sent to ${email}!`)
      });
    },

    logout () {
      get(this, 'session').invalidate();
    }
  }
});
```

__Note that you can pass in a callback as the last argument. This proxies the lock-passwordless callback call so that the developer can then handle events after a passwordless link has been sent__

# Acceptance Testing

If you want to acceptance test the auth0 lock there are two things you can do.

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

__Errors come back as a hash in the url. These will be automatically parsed and ember will transition to the error route with two variables set on the model. error and errorDescription__

`ember g template application-error`

```hbs
// app/templates/application-error.hbs

Encountered an error from auth0 - {{model.error}} -- {{model.errorDescription}}
```

## Calling an API

See [server](./server) for an example of an express application getting called by the ember app.

If you are using [ember-data](https://github.com/emberjs/data)

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

## Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
