var React = require('react');
var ReactRouter = require('react-router');
var Fetcher = require('./fetcher');
var MicroEvent = require('microevent');
var _ = require('lodash');
var isServer = (typeof window === 'undefined');
var _currentRoute;

function ReactionRouter(options) {
  this.routes = [];
  this._initOptions(options);
}

MicroEvent.mixin(ReactionRouter);

ReactionRouter.prototype._initOptions = function(options) {
  var entryPath;

  options = options || {};
  options.paths = options.paths || {};

  entryPath = options.paths.entryPath || options.entryPath;

  options.paths = _.defaults(options.paths, {
    entryPath: entryPath,
    routes: entryPath + 'app/routes',
    componentsDir: entryPath + 'app/react/components'
  });

  this.options = options;
  this.fetcher = new Fetcher();
}

ReactionRouter.prototype.getComponentPath = function(componentName) {
  var componentsDir = this.options.paths.componentsDir;
  return componentsDir + '/' + componentName;
}

ReactionRouter.prototype.loadComponent = function(componentName) {
  var componentPath = this.getcomponentPath(componentName);
  return require(componentPath);
}

ReactionRouter.prototype.getRouteBuilder = function() {
  return require(this.options.paths.routes);
}

ReactionRouter.prototype.buildRoutes = function() {
  var routeBuilder = this.getRouteBuilder();
  var componentsDir = this.options.paths.componentsDir;
  var routes = {};
  var mountPath = this.options.mountPath || '';
  var that = this;

  function captureRoutes(options, callback) {
    if (!callback) {
      routes[options.name] = options
    }
    else {
      var routeNest = _.toArray(arguments);
      var parentRoute = routeNest[0];
      var children = routeNest.slice(1);

      // remove processed children from routes object
      _.each(children, function(child) {
        if (child !== undefined) {
          delete routes[child.name];
        }
      });

      // add children as property to main route
      parentRoute.children = children;
      routes[parentRoute.name] = parentRoute;
    }

    return options;
  }

  routeBuilder(captureRoutes);

  // routes.forEach(this.addRouteDefinition, this);
  return routes;
}

ReactionRouter.prototype.addRouteDefinition = function(route) {
  console.log(route);
  return false;
  var args = route;
  var options = args[0] || {};
  var route;

  // Prefix React Router paths if a mountPath
  // is set and the react path is absolute
  if (options.path && options.path.charAt(0) === '/') {
    if (options.path === '/') {
      options.path = mountPath;
    }
    else {
      options.path = mountPath + options.path;
    }
  }

  options.handler = require(componentsDir + '/' + options.handler);
  route = options;

  console.log(arguments);

  // add route to server
  that.trigger('route:add', options);

  // if we have multiple arguments
  // it means this is a parent
  if (args.length > 1) {
    var childRoutes = args.splice(1), child;

    route = ReactRouter.createRoute(options);
    routes.push(route);

    _.each(childRoutes, function(childRoute) {
      // format route before adding to server
      child = childRoute;
      child.parentRoutePath = route.path;
      that.trigger('route:add', child);

      // add route to react
      childRoute.parentRoute = route;
      ReactRouter.createRoute(childRoute);
    });
  }

  return route;
}

ReactionRouter.prototype.start = function() {
  if (!isServer) {
    var that = this;
    window.onload = function() {
      ReactRouter.run(that.buildRoutes(), ReactRouter.HistoryLocation, function (Handler, state) {
        that.fetcher.fetchData(state.routes, state.params).then(function(data) {
          React.render(React.createFactory(Handler)({ data: data }), document.body);
        });
      });
    }
  }
}

module.exports = ReactionRouter;
