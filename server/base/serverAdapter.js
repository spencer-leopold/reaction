var Router = require('../../shared/router');
var Events = require('../../shared/events');

function BaseServer(options) {
  // @TODO: Add some error checking for options
  this.options = options || {};
  this.serverRoutePaths = [];
  this.serverRoutesObj = {};
  // Listen for new routes and parse them
  Events.on('route:add', this.parseRoute, this);
  // Attach the router and trigger all routes to be built
  this.router = new Router(options);
  this.router.buildRoutes();
}

BaseServer.prototype.parseRoute = function(options, component, mainComponent) {
  var path = '', handler;
  options = options || {};

  if (options.path) {
    path = options.path;
    path = this.formatParams(path);

    if (this.serverRoutePaths.indexOf(options.path) === -1) {

      // check path again after formatting
      if (this.serverRoutePaths.indexOf(path) === -1) {
        // Only add to route paths if it's also
        // a react route. Prevents adding routes
        // for stuff like assets.
        if (options.name || component) {
          this.serverRoutePaths.push(path);
        }

        this.addRoute(path, options);
      }
    }
  }
}

/**
 * Implement these methods in child class
 */
BaseServer.prototype.addRoute = function(path, options) {
  throw new Error('`addRoute` needs to be implemented');
}

BaseServer.prototype.formatParams = function(path) {
  throw new Error('`formatParams` needs to be implemented');
}

module.exports = BaseServer;
