var BaseServerAdapter = require('./base/serverAdapter');
var util = require('util');

function ExpressAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

/**
 * Extend base Server class
 */
util.inherits(ExpressAdapter, BaseServerAdapter);

ExpressAdapter.prototype.handleResponse = function(req, res, body) {
  res.send(body);
}

ExpressAdapter.prototype.handleNext = function(req, res, next) {
  next();
}

ExpressAdapter.prototype.addRoute = function(route, handler) {
  this.server.get(route.path, handler);
}

ExpressAdapter.prototype.attachServerFetcher = function(callback) {
  this.server.use(function(req, res, next) {
    callback(req, res, next);
  });
}

ExpressAdapter.prototype.attachApiProxy = function(apiPath, callback) {
  this.server.use(apiPath, function(req, res, next) {
    var respond = res.json.bind(res);
    callback(req, respond);
  });
}

ExpressAdapter.prototype.attachErrorHandler = function(renderTemplateCb) {
  this.server.use(function(req, res) {
    if (!res.headersSent) {
      res.send(renderTemplateCb(404));
    }
  });
}

module.exports = ExpressAdapter;
