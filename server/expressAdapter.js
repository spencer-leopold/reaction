var BaseServerAdapter = require('./base/serverAdapter.js');
var util = require('util');
var express = require('express');

function ExpressAdapter(options, serverInstance) {
  this.server = serverInstance;
  this.expressRouter = express.Router();

  BaseServerAdapter.call(this, options);

  this.attachProxyMiddleware();
  this.attachFetcherMiddleware();
  this.attachRoutes();

  return this.server;
}

/**
 * Extend base Server class
 */
util.inherits(ExpressAdapter, BaseServerAdapter);

ExpressAdapter.prototype.formatParams = function(path) {
  return path;
}

ExpressAdapter.prototype.addRoute = function(path, options) {
  var handler = this.buildHander(options, 'send');
  this.expressRouter.get(path, handler);
}


ExpressAdapter.prototype.attachProxyMiddleware = function() {
  var apiConfig = this.options.api;
  this.server.use('/api', require('./middleware/apiProxy')(apiConfig));
}

ExpressAdapter.prototype.attachFetcherMiddleware = function() {
  var reactRoutes = this.router.routes;
  var serverRoutePaths = this.serverRoutePaths;
  var serverRoutesObj = this.serverRoutesObj;

  var middlewareOptions = {
    reactRoutes: reactRoutes,
    serverRoutePaths: serverRoutePaths,
    serverRoutesObj: serverRoutesObj
  }

  this.server.use(require('./middleware/expressFetch')(middlewareOptions));
}

ExpressAdapter.prototype.attachRoutes = function() {
  this.server.use(this.expressRouter);
}

module.exports = ExpressAdapter;
