var Router = require('../../shared/router');
var Events = require('../../shared/events');

function Server(options, serverInstance) {
  // @TODO: Add some error checking for options
  this.options = options || {};
  this.serverRoutePaths = [];
  this.serverRoutesObj = {};
  // Listen for new routes and parse them for Hapi
  Events.on('route:add', this.parseRoute, this);
  // Attach the router and trigger all routes to be built
  this.router = new Router(options);
  this.router.buildRoutes();
}

Server.prototype.parseRoute = function(options, component, mainComponent) {
  var path = '', handler;
  options = options || {};

  if (options.path) {
    path = options.path;
    path = this.formatParams(path);
    // path = path.replace(/\:([^\/\s]*)/g, '{$1}');

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
Server.prototype.addRoute = function(path, options) {
}

Server.prototype.formatParams = function(path) {
}


module.exports = Server;
