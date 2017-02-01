var BaseServerAdapter = require('./BaseServerAdapter');
var util = require('util');

/**
 * Constructs a new ExpressAdapter instance.
 *
 * @class
 * @classdesc Adapter to use Reaction with Express as the server.
 * @augments BaseServerAdapter
 * @inheritdoc
 */
function ExpressAdapter(options, server) {
  BaseServerAdapter.call(this, options, server);
  return server;
}

// Extend the BaseServerAdapter class.
util.inherits(ExpressAdapter, BaseServerAdapter);

/**
 * @inheritdoc
 */
ExpressAdapter.prototype.handleResponse = function(req, res, body) {
  res.send(body);
}

/**
 * @inheritdoc
 */
ExpressAdapter.prototype.handleNext = function(req, res, next) {
  next();
}

/**
 * @inheritdoc
 */
ExpressAdapter.prototype.addRoute = function(route, handler) {
  this.server.get(route.path, handler);
}

/**
 * @inheritdoc
 */
ExpressAdapter.prototype.attachApiProxy = function(apiPath, callback) {
  this.server.use(apiPath, function(req, res, next) {
    var respond = res.json.bind(res);
    callback(req, respond);
  });
}

/**
 * @inheritdoc
 */
ExpressAdapter.prototype.attachErrorHandler = function(renderTemplateCb) {
  this.server.use(function(req, res) {
    if (!res.headersSent) {
      res.send(renderTemplateCb(404));
    }
  });
}

module.exports = ExpressAdapter;
