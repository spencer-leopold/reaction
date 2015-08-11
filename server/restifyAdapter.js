var BaseServerAdapter = require('./base/serverAdapter');
var util = require('util');

function RestifyAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

/**
 * Extend base Server class
 */
util.inherits(RestifyAdapter, BaseServerAdapter);

RestifyAdapter.prototype.handleResponse = function(req, res, body) {
  res.send(body);
}

RestifyAdapter.prototype.handleNext = function(req, res, next) {
  next();
}

RestifyAdapter.prototype.addRoute = function(route, handler) {
  this.server.get(route.path, handler);
}

RestifyAdapter.prototype.attachServerFetcher = function(callback) {
  this.server.use(function(req, res, next) {
    callback(req, res, next);
  });
}

RestifyAdapter.prototype.attachApiProxy = function(apiPath, callback) {
  this.server.use(apiPath, function(req, res, next) {
    var callback = res.json.bind(res);
    callback(req, callback);
  });
}

RestifyAdapter.prototype.attachErrorHandler = function(renderTemplateCb) {
  this.server.use(function(req, res) {
    if (!res.headersSent) {
      res.send(renderTemplateCb(404));
    }
  });
}

module.exports = RestifyAdapter;
