var BaseServer = require('./base/server');
var React = require('react');
var util = require('util');
var express = require('express');
var _ = require('lodash');

function ExpressServer(options, serverInstance) {
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
util.inherits(ExpressServer, BaseServer);

ExpressServer.prototype.formatParams = function(path) {
  return path;
}

ExpressServer.prototype.addRoute = function(path, options) {
  var handler;
  var entryPath = this.router.options.entryPath;
  var templatesDir = this.router.options.paths.templatesDir;

  // Rewrite app paths for use on client-side
  var clientOptions = _.cloneDeep(this.router.options);
  clientOptions.entryPath = '';
  clientOptions.paths.entryPath = '';
  clientOptions.paths.routes = clientOptions.paths.routes.replace(entryPath, '');
  clientOptions.paths.componentsDir = clientOptions.paths.componentsDir.replace(entryPath, '');
  clientOptions.paths.templatesDir = clientOptions.paths.templatesDir.replace(entryPath, '');

  if (options.handle) {
    if (typeof options.handle !== 'function') {
      throw new Error('Route handle must be a function');
    }
    else {
      handler = function(request, response) {
        options.handle(request, response);
      }
    }
  }
  else {
    handler = function(request, response) {
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
          o += "\tvar bootstapData = "+JSON.stringify(attrs.appData)+";\n";
          o += "\tvar appSettings = "+JSON.stringify(clientOptions)+";\n";
          o += "\tvar ReactionRouter = window.ReactionRouter = require('reaction').Router(appSettings);\n";
          o += "\tReactionRouter.start(bootstapData, '"+locationType+"', document.body);\n";
          o += "})();\n";
          o += "</script>";

          return o;
        }
      }

      var layoutTemplate = require(templatesDir + '/layout.jsx');
      var markup = React.renderToString(React.createFactory(layoutTemplate)(templateVars));
      response.send(markup);
    }
  }

  this.expressRouter.get(path, handler);
}

ExpressServer.prototype.attachMiddleware = function() {
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

ExpressServer.prototype.attachRoutes = function() {
  this.server.use(this.expressRouter);
}

module.exports = ExpressServer;
