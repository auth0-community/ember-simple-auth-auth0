import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import moment from 'moment';

export default Controller.extend({
  session: service(),
  auth0: service(),
  posts: alias('model'),
  expiresIn: computed('session.data.authenticated', function() {
    const foo = get(this, 'session.data.authenticated.idTokenPayload.exp');
    if (foo) {
      return moment.unix(foo);
    }

    const exp = get(this, 'session.data.authenticated.expiresIn');
    return Date.now() + exp * 1000;
  }),
  actions: {
    logout() {
      get(this, 'session').invalidate();
    },
    logoutOfAuth0() {
      get(this, 'auth0').logout();
    }
  }
});
