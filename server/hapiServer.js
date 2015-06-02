var React = require('react');
var BaseServer = require('./base/server');
var util = require('util');
var _ = require('../shared/lodash.custom');

function HapiServer(options, serverInstance) {
  if (!options.appName && !options.mountPath) {
    this.server = serverInstance;
  }
  else {
    var serverName = (options.appName) ? options.appName : options.mountPath.replace(/^\//, '');
    var server = serverInstance.connection({ port: options.port, labels: serverName });
    this.server = server.select(serverName);
  }

  BaseServer.call(this, options, serverInstance);

  this.attachPlugins();

  return this.server;
}

/**
 * Extend base Server class
 */
util.inherits(HapiServer, BaseServer);

HapiServer.prototype.formatParams = function(path) {
  var formattedPath = path.replace(/\:([^\/\s]*)/g, '{$1}');
  return formattedPath;
}

HapiServer.prototype.addRoute = function(path, options) {
  var handler;
  var entryPath = this.router.options.entryPath;
  var templatesDir = this.router.options.paths.templatesDir;

  // Rewrite app paths for use on client-side
  var clientOptions = _.cloneDeep(this.router.options);
  // clientOptions.entryPath = '';
  // clientOptions.paths.entryPath = '';
  // clientOptions.paths.routes = clientOptions.paths.routes.replace(entryPath, '');
  // clientOptions.paths.componentsDir = clientOptions.paths.componentsDir.replace(entryPath, '');
  // clientOptions.paths.templatesDir = clientOptions.paths.templatesDir.replace(entryPath, '');

  if (options.handle) {
    if (typeof options.handle !== 'function' && typeof options.handle !== 'object') {
      throw new Error('Route handle must be an object or function');
    }

    if (typeof options.handle === 'object') {
      handler = options.handle;
    }

    if (typeof options.handle === 'function') {
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
        },
        start: function(locationType) {
          var o = "<script type='text/javascript'>";
          o += "(function() {\n";
          o += "\tvar bootstrapData = "+JSON.stringify(attrs.appData)+";\n";
          o += "\tvar appSettings = "+JSON.stringify(clientOptions)+";\n";
          o += "\tvar ReactionRouter = window.ReactionRouter = require('reaction').Router(appSettings);\n";
          o += "\tReactionRouter.start(bootstrapData, '"+locationType+"', document.body);\n";
          o += "})();\n";
          o += "</script>";

          return o;
        }
      }

      var layoutTemplate = require(templatesDir + '/layout.jsx');
      var markup = React.renderToString(React.createFactory(layoutTemplate)(templateVars));
      reply(markup);
    }
  }

  this.server.route({
    method: 'GET',
    path: path,
    handler: handler
  });
}

HapiServer.prototype.attachPlugins = function() {
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

module.exports = HapiServer;
