var BaseServerAdapter = require('./base/serverAdapter.js');
var util = require('util');

function HapiAdapter(options, serverInstance) {
  this.server = serverInstance;

  BaseServerAdapter.call(this, options);

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

HapiAdapter.prototype.attachServerFetcher = function() {
  var plugin = this.loadServerFetcher('plugin');

  this.server.register({
    register: plugin
  }, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

HapiAdapter.prototype.attachApiProxy = function() {
  var plugin = this.loadApiProxy('plugin');
  var apiPath = this.options.apiPath || '/api';

  this.server.register({ register: plugin }, {
    routes: {
      prefix: apiPath
    }
  }, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

module.exports = HapiAdapter;
