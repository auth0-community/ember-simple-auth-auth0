import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { get } from '@ember/object';
import Ember from 'ember';

const {
  Logger
} = Ember;

export default Controller.extend({
  session: service(),
  myModel: alias('model'),
  actions: {
    login() {
      get(this, 'session').authenticate('authenticator:auth0-lock');
    },
    loginPasswordless(method, connection) {
      const lockOptions = {
        passwordlessMethod: method,
        allowedConnections: [connection],
        autoclose: true,
      };

      get(this, 'session').authenticate('authenticator:auth0-lock-passwordless', lockOptions, () => {
        Logger.info('Passwordless sent');
      });
    }
  }
});
