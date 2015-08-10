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

ExpressAdapter.prototype.attachRoutes = function() {
  var route, handler, routes = this.serverRoutes;

  for (var i in routes) {
    route = routes[i];
    handler = this.buildHandler(route.options, 'send');
    this.server.get(route.path, handler);
  }
}

ExpressAdapter.prototype.attachServerFetcher = function(callback) {
  this.server.use(function(req, res, next) {
    var path;

    if (typeof req.url === 'string') {
      path = req.url;
    }
    else {
      path = req.url.path;
    }

    callback(req, path, next);
  });
}

ExpressAdapter.prototype.attachApiProxy = function(apiPath, callback) {
  this.server.use(apiPath, function(req, res, next) {
    var callback = res.json.bind(res);
    callback(req, res, callback);
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
