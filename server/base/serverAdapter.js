var React = require('react');
var Router = require('../../shared/router');
var Events = require('../../shared/events').Dispatcher;
var _ = require('../../shared/lodash.custom');

function BaseAdapter(options) {
  // @TODO: Add some error checking for options
  this.options = options || {};
  this.serverRoutes = [];
  this.serverRoutePaths = [];

  // Listen for new routes and parse them
  Events.on('route:add', this.parseRoute, this);
  Events.on('routes:finished', this.attachServerFetcher, this);
  Events.on('routes:finished', this.attachRoutes, this);

  // Attach the router and trigger all routes to be built
  this.router = new Router(options);
  this.router.buildRoutes();

  if (this.options.api) {
    if (!this.options.dataAdapter) {
      this.options.dataAdapter = require('../data_adapters/rest_adapter');
    }

    this.attachApiProxy(this.options);
  }
}

BaseAdapter.prototype.parseRoute = function(event, options, component, mainComponent) {
  var path = '', handler;
  options = options || {};

  if (options.path) {
    path = options.path;
    path = this.formatParams(path);

    if (this.serverRoutePaths.indexOf(path) === -1) {
      // Only add to route paths if it's also
      // a react route. Prevents adding routes
      // for stuff like assets.
      if (options.name || component) {
        this.serverRoutePaths.push(path);
      }

      this.serverRoutes.push({ path: path, options: options });
      this.serverRoutePaths.push(path);
    }
  }
}

BaseAdapter.prototype.buildHandler = function(options, responseMethod) {
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
      var reactionData = request.reactionData || {};
      var templateVars = {
        body: reactionData.body,
        appData: {
          data: reactionData.appData,
          path: request.path
        },
        start: function(replaceElement, locationType) {
          if (!replaceElement) {
            replaceElement = 'document.body';
          }
          var o = "<script type='text/javascript'>";
          o += "(function() {\n";
          o += "\tvar bootstrapData = "+JSON.stringify(reactionData.appData)+";\n";
          o += "\tvar appSettings = "+JSON.stringify(clientOptions)+";\n";
          o += "\tvar ReactionRouter = window.ReactionRouter = require('reaction').Router(appSettings);\n";
          o += "\tReactionRouter.start(bootstrapData, '"+locationType+"', "+replaceElement+");\n";
          o += "})();\n";
          o += "</script>";

          return o;
        }
      }

      var layoutTemplate = require(templatesDir + '/' + routeTemplate);
      var markup = React.renderToString(React.createFactory(layoutTemplate)(templateVars));

      if (!responseMethod) {
        response(markup);
      }
      else {
        response[responseMethod](markup);
      }

      if (next) {
        next();
      }
    }
  }

  return handler;
}

BaseAdapter.prototype.getFetcherCallback = function() {
  var renderFn = require('./renderRouteData')(this.router.routes);
  return this.routeCallback(renderFn);
}

BaseAdapter.prototype.loadApiProxy = function(type) {
  var pluginOptions = {
    type: type,
    api: this.options.api,
    dataAdapter: this.options.dataAdapter
  }

  return require('./apiProxy')(pluginOptions);
}

/**
 * Implement these methods in child class
 */
BaseAdapter.prototype.attachRoutes = function(routes) {
  throw new Error('`attachRoutes` needs to be implemented');
}

/**
 * routeCallback needs to return middleware that
 * executes the callback function
 * @param {Function} callback
 *
 * callback
 * @param {Object} req
 * @param {String} baseUrl
 * @param {String} path
 * @param {Function} next
 */
BaseAdapter.prototype.routeCallback = function(callback) {
  throw new Error('`routeCallback` needs to be implemented');
}

// Most servers use a similar route convention so we shouldn't
// require `formatParams` to be implemented, instead by default
// we just return the path so that it can be overridden for cases
// like when using Hapi
BaseAdapter.prototype.formatParams = function(path) {
  return path;
}

BaseAdapter.prototype.attachServerFetcher = function(path, options) {
  throw new Error('`attachServerFetcher` needs to be implemented');
}

BaseAdapter.prototype.attachApiProxy = function(options) {
  throw new Error('`attachApiProxy` needs to be implemented');
}

module.exports = BaseAdapter;
