var React = require('react');
var ReactRouter = require('react-router');
var Fetcher = require('./fetcher');
var MicroEvent = require('./events');
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
  var mountPath = this.options.mountPath || '';
  var routes = {}, path;

  function captureRoutes(options, callback) {
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

    if (!callback) {
      routes[options.name] = options
    }
    else {
      var routeNest = _.toArray(arguments);
      var parentRoute = routeNest[0];
      var children = routeNest.slice(1);
      var separator = '/';

      // remove processed children from routes object
      _.each(children, function(child, i) {
        if (child !== undefined) {
          delete routes[child.name];
        }

        children[i].parent = parentRoute;
      });

      // add children as property to main route
      parentRoute.childRoutes = children;
      routes[parentRoute.name] = parentRoute;
    }

    return options;
  }

  routeBuilder(captureRoutes);

  // Loop through routes object and add definitions
  _.each(Object.keys(routes), function(route, i) {
    this.addRouteDefinition(routes[route]);
  }.bind(this));

  return this.routes;
}

ReactionRouter.prototype.addRouteDefinition = function(route) {
  var componentsDir = this.options.paths.componentsDir;
  var that = this;

  function buildChildPaths(path, child) {
    if (child.path && child.path.charAt(0) !== '/') {
      if (path === '/') {
        child.path = path + child.path;
      }
      else {
        child.path = path + '/' + child.path;
      }
    }

    if (child.childRoutes) {
      _.each(child.childRoutes, function(childRoute) {
        buildChildPaths(child.path, childRoute);
      });
    }
  }

  // Make relative children paths absolute
  if (route.childRoutes) {
    _.each(route.childRoutes, function(childRoute) {
      buildChildPaths(route.path, childRoute);
    });
  }

  // recursive helper to run through routes and children
  function checkChildRoutes(route, parent) {
    var addToRoutes = true, reactRoute;

    // Attach the React component, it's originally set as
    // a string to prevent having to require all components
    // in the routes.js file
    if (route.name) {

      // Only add the route to react if it has a name,
      // otherwise it's a server route only
      route.handler = require(componentsDir + '/' + route.handler);

      // If a parent is passed as an argument we
      // add it as a parentRoute
      if (parent) {
        route.parentRoute = parent;
      }

      reactRoute = ReactRouter.createRoute(route);
    }

    that.trigger('route:add', route);

    // If route doesn't have a parent it's a top-level route,
    // so we want to add it to the main routes array
    if (route.parent) {
      addToRoutes = false;
    }

    // If the route has children, run the function again
    // this time passing the current route as the `parent` parameter.
    // This will repeat for as long as necessary until full nested route
    // definition is built.
    if (route.childRoutes) {
      _.each(route.childRoutes, function(child) {
        checkChildRoutes(child, reactRoute);
      });
    }

    // If top-level route and not a server only route
    // add to our main routes array
    if (addToRoutes && route.name) {
      that.routes.push(reactRoute);
    }
  }

  checkChildRoutes(route);

  return route;
}

ReactionRouter.prototype.start = function(appData, el) {
  if (!isServer) {
    var that = this;
    if (!el) {
      var el = document.body
    }

    window.onload = function() {
      ReactRouter.run(that.buildRoutes(), ReactRouter.HistoryLocation, function (Handler, state) {
        if (appData.path === state.path) {
          React.render(React.createFactory(Handler)(appData), el);
        }
        else {
          var fetcher = Fetcher();
          fetcher.fetchData(state.routes, state.params).then(function(data) {
            React.render(React.createFactory(Handler)({ data: data }), el);
          });
        }
      });
    }
  }
}

module.exports = ReactionRouter;
