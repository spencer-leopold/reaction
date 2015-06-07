var BaseServerAdapter = require('./base/serverAdapter.js');
var util = require('util');

function HapiAdapter(options, serverInstance) {
  if (!options.appName && !options.mountPath) {
    this.server = serverInstance;
  }
  else {
    var serverName = (options.appName) ? options.appName : options.mountPath.replace(/^\//, '');
    var server = serverInstance.connection({ port: options.port, labels: serverName });
    this.server = server.select(serverName);
  }

  BaseServerAdapter.call(this, options);

  this.attachFetcherPlugin();

  if (options.api) {
    this.attachApiProxyPlugin(options.api);
  }

  return this.server;
}

/**
 * Extend base Server class
 */
util.inherits(HapiAdapter, BaseServerAdapter);

HapiAdapter.prototype.formatParams = function(path) {
  var formattedPath = path.replace(/\:([^\/\s]*)/g, '{$1}');
  return formattedPath;
}

HapiAdapter.prototype.addRoute = function(path, options) {
  var handler = this.buildHandler(options);

  this.server.route({
    method: 'GET',
    path: path,
    handler: handler
  });
}

HapiAdapter.prototype.attachFetcherPlugin = function() {
  // Add our fetcher to be used in getHandler
  var reactRoutes = this.router.routes;
  var serverRoutePaths = this.serverRoutePaths;
  var serverRoutesObj = this.serverRoutesObj;

  var pluginOptions = {
    reactRoutes: reactRoutes,
    serverRoutePaths: serverRoutePaths,
    serverRoutesObj: serverRoutesObj
  }

  this.server.register({
    register: require('./plugins/hapiFetch'),
    options: pluginOptions
  }, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

HapiAdapter.prototype.attachApiProxyPlugin = function(apiConfig) {
  this.server.register({
    register: require('./plugins/apiProxy'),
    options: apiConfig
  }, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

module.exports = HapiAdapter;
