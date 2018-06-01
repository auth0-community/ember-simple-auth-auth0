'use strict';

module.exports = {
  description: '',
  normalizeEntityName() {
    // no-op since we're just adding dependencies
  },
  afterInstall() {
    return this.addPackageToProject('ember-simple-auth');
  }
};
