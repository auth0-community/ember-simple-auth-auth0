import { inject as service } from '@ember/service';
import DS from 'ember-data';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';

const {
  JSONAPIAdapter,
} = DS;

export default JSONAPIAdapter.extend(DataAdapterMixin, {
  namespace: 'api',

  session: service('session'),

  authorize(xhr) {
    let { idToken } = this.get('session.data.authenticated');
    let authData = `Bearer ${idToken}`;
    xhr.setRequestHeader('Authorization', authData);
  }
});
