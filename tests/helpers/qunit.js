import EmObject from '@ember/object';
import Ember from 'ember';
import {
  test,
  module as qunitModule
} from 'qunit';

const {
  _RegistryProxyMixin,
  _ContainerProxyMixin,
  Registry
} = Ember;

let Owner = EmObject.extend(_RegistryProxyMixin, _ContainerProxyMixin);

const module = function(name, settings) {
  settings = settings || {};
  qunitModule(name, {
    beforeEach: function() {
      this.registry = new Registry();

      this.owner = Owner.create({
        __registry__: this.registry
      });

      this.container = this.registry.container({
        owner: this.owner
      });

      this.owner.__container__ = this.container;
      if (typeof settings.beforeEach === 'function') {
        return settings.beforeEach(...arguments);
      }
    },
    afterEach: function() {
      this.container = null;
      this.registry = null;
      this.owner = null;
      if (typeof settings.afterEach === 'function') {
        return settings.afterEach(...arguments);
      }
    }
  });
};

export {
  module,
  test
};
