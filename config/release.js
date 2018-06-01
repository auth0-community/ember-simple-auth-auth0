'use strict';

const generateChangelog = require('ember-cli-changelog/lib/tasks/release-with-changelog');
const child_process = require('child_process');
const exec = child_process.exec;

// For details on each option run `ember help release`
module.exports = {
  message: ':tada: %@',
  publish: true,
  init(project, tags) {
    return execPromisified(`git hf release start ${tags.next}`);
  },

  afterPush(project, tags) {
    return execPromisified(`git hf release finish ${tags.next}`);
  },

  beforeCommit() {
    return generateChangelog(...arguments); // eslint-disable-line node/no-unsupported-features
  }
};

function execPromisified(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err) => {
      if (err) {
        return reject(new Error(`Could not complete '${command}' -- ${err}`));
      }

      resolve();
    });
  });
}
