var BaseServerAdapter = require('./base/serverAdapter.js');
var React = require('react');
var util = require('util');
var express = require('express');
var _ = require('../shared/lodash.custom');

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
  var handler;
  var entryPath = this.router.options.entryPath;
  var templatesDir = this.router.options.paths.templatesDir;
  var routeTemplate = options.template || 'layout';

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
      handler = function(request, response, next) {
        options.handle(request, response, next);
      }
    }
  }
  else {
    handler = function(request, response, next) {
      var attrs = request.attributes || {};
      var templateVars = {
        body: attrs.body,
        appData: {
          data: attrs.appData,
          path: request.path
        },
        start: function(locationType, replaceElement) {
          if (!replaceElement) {
            replaceElement = 'body';
          }
          var o = "<script type='text/javascript'>";
          o += "(function() {\n";
          o += "\tvar bootstrapData = "+JSON.stringify(attrs.appData)+";\n";
          o += "\tvar appSettings = "+JSON.stringify(clientOptions)+";\n";
          o += "\tvar ReactionRouter = window.ReactionRouter = require('reaction').Router(appSettings);\n";
          o += "\tReactionRouter.start(bootstrapData, '"+locationType+"', document['"+replaceElement+"']);\n";
          o += "})();\n";
          o += "</script>";

          return o;
        }
      }

      var layoutTemplate = require(templatesDir + '/' + routeTemplate);
      var markup = React.renderToString(React.createFactory(layoutTemplate)(templateVars));
      response.send(markup);
      next();
    }
  }

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
