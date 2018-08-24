import { inject as service } from '@ember/service';
import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';

export default JSONAPIAdapter.extend(DataAdapterMixin, {
  namespace: 'api',

  session: service('session'),

  authorize(xhr) {
    let { idToken } = this.get('session.data.authenticated');
    let authData = `Bearer ${idToken}`;
    xhr.setRequestHeader('Authorization', authData);
  }
});
