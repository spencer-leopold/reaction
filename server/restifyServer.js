var BaseServer = require('./base/server');
var util = require('util');
var express = require('express');

function RestifyServer(options, serverInstance) {
  this.server = serverInstance;
  this.expressRouter = express.Router();

  BaseServer.call(this, options, serverInstance);

  this.attachMiddleware();
  this.attachRoutes();

  return this.server;
}

/**
 * Extend base Server class
 */
util.inherits(RestifyServer, BaseServer);

RestifyServer.prototype.formatParams = function(path) {
  return path;
}

RestifyServer.prototype.addRoute = function(path, options) {
  var handler;

  if (options.handle) {
    if (typeof options.handle !== 'function') {
      throw new Error('Route handle must be a function');
    }
    else {
      handler = function(request, reply) {
        options.handle(request, reply);
      }
    }
  }
  else {
    handler = function(request, reply) {
      var attrs = request.attributes || {};
      var templateVars = {
        body: attrs.body,
        appData: {
          data: attrs.appData,
          path: request.path
        }
      }

      reply.render('index', templateVars);
    }
  }

  this.expressRouter.get(path, handler);
}

RestifyServer.prototype.attachMiddleware = function() {
  var reactRoutes = this.router.routes;
  var serverRoutePaths = this.serverRoutePaths;
  var serverRoutesObj = this.serverRoutesObj;
  var apiConfig = this.options.api;

  var middlewareOptions = {
    reactRoutes: reactRoutes,
    serverRoutePaths: serverRoutePaths,
    serverRoutesObj: serverRoutesObj
  }

  this.server.use(require('./middleware/expressFetch')(middlewareOptions));
  this.server.use('/api', require('./middleware/apiProxy')(apiConfig));
}

RestifyServer.prototype.attachRoutes = function() {
  this.server.use(this.expressRouter);
}

module.exports = RestifyServer;
