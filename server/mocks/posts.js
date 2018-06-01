'use strict';

const express = require('express');
const router = express.Router();
const expressJWT = require('express-jwt');
const jwksRsa = require('jwks-rsa');
require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  console.error('Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your .env file'); //eslint-disable-line no-console
}

module.exports = function(app) {
  const post = {
    id: 1,
    type: 'posts',
    attributes: {
      title: 'I am a protected post',
    },
  };

  router.get('/', function(req, res) {
    res.send({
      data: [post]
    });
  });

  const audience = process.env.AUTH0_AUDIENCE;
  const domain = process.env.AUTH0_DOMAIN;

  const jwtMiddleware = expressJWT({
    issuer: `https://${domain}/`,
    audience,
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${domain}/.well-known/jwks.json`
    }),
    algorithms: ['RS256'],
  });

  app.use('/api/posts', jwtMiddleware, router);
};
