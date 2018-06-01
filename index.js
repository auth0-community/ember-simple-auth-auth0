'use strict';

const path = require('path');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const Webpack = require('broccoli-webpack');
const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const wp = require('webpack');

function transformAMD(name) {
  return { using: [{ transformation: 'amd', as: name }] };
}

function webpackify(name, dir) {
  const fun = new Funnel(path.dirname(require.resolve(name + '/' + dir + '/index.js'), {
    destDir: name,
    files: ['index.js']
  }));
  return new Webpack([fun], {
    entry: [name + '/' + dir + '/index.js'],
    output: {
      filename: name + '.js',
      library: name,
      libraryTarget: 'umd'
    },
    plugins: [
      new wp.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(EmberAddon.env())
      })
    ]
  });
}

module.exports = {
  name: 'ember-simple-auth-auth0',
  included: function(app) {
    this._super.included(app);

    app.import('vendor/auth0-js.js', transformAMD('auth0'));
    app.import('vendor/auth0-lock.js', transformAMD('auth0-lock'));

    return app;
  },

  treeForVendor: function(vendorTree) {
      const trees = [];
      if (vendorTree) {
        trees.push(vendorTree);
      }

      // [XA] use webpack to transform the CommonJS libs to AMD so we can import 'em.

      trees.push(webpackify('auth0-js', 'src'));
      trees.push(webpackify('auth0-lock', 'lib'));

      return new MergeTrees(trees);
  }
};
