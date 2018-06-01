import Route from '@ember/routing/route';
import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

const {
  Logger
} = Ember;

export default Route.extend(AuthenticatedRouteMixin, {
  authenticationRoute: 'login',
  model() {
    return this.store.findAll('post').catch((err) => {
      Logger.error(err);
    });
  }
});
