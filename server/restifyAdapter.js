var BaseServerAdapter = require('./base/serverAdapter');
var util = require('util');

/**
 * Constructs a new RestifyAdapter instance.
 *
 * @class
 * @classdesc Adapter to use Reaction with Restify as the server.
 * @augments BaseAdapter
 * @inheritdoc
 */
function RestifyAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

// Extend the BaseAdapter class.
util.inherits(RestifyAdapter, BaseServerAdapter);

/**
 * @inheritdoc
 */
RestifyAdapter.prototype.handleResponse = function(req, res, body) {
  res.send(body);
}

/**
 * @inheritdoc
 */
RestifyAdapter.prototype.handleNext = function(req, res, next) {
  next();
}

/**
 * @inheritdoc
 */
RestifyAdapter.prototype.addRoute = function(route, handler) {
  this.server.get(route.path, handler);
}

/**
 * @inheritdoc
 */
RestifyAdapter.prototype.attachApiProxy = function(apiPath, callback) {
  this.server.use(apiPath, function(req, res, next) {
    var responsd = res.json.bind(res);
    callback(req, responsd);
  });
}

/**
 * @inheritdoc
 */
RestifyAdapter.prototype.attachErrorHandler = function(renderTemplateCb) {
  this.server.use(function(req, res) {
    if (!res.headersSent) {
      res.send(renderTemplateCb(404));
    }
  });
}

module.exports = RestifyAdapter;
