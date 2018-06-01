'use strict';

module.exports = function(app) {
  const postsRoute = require('./mocks/posts.js');

  // Log proxy requests
  let morgan = require('morgan');
  app.use(morgan('dev'));
  postsRoute(app);
};
