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
  var routes = {};

  function captureRoutes(options, callback) {
    if (!callback) {
      routes[options.name] = options
    }
    else {
      var routeNest = _.toArray(arguments);
      var parentRoute = routeNest[0];
      var children = routeNest.slice(1);

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
  var mountPath = this.options.mountPath || '';
  var that = this;

  // recursive helper to run through routes and children
  function checkChildRoutes(route, parent) {
    var addToRoutes = true, reactRoute;

    // Prefix React Router paths if a mountPath
    // is set and the react path is absolute
    if (route.path && route.path.charAt(0) === '/') {
      if (route.path === '/') {
        route.path = mountPath;
      }
      else {
        route.path = mountPath + route.path;
      }
    }

    that.trigger('route:add', route);

    // Attach the React component, it's originally set as
    // a string to prevent having to require all components
    // in the routes.js file
    route.handler = require(componentsDir + '/' + route.handler);

    reactRoute = ReactRouter.createRoute(route);

    // If route doesn't have a parent it's a top-level route,
    // so we want to add it to the main routes array
    if (route.parent) {
      addToRoutes = false;
    }

    // If a parent is passed as an argument we
    // need to append this route to it
    if (parent) {
      parent.appendChild(reactRoute);
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

    // If top-level route, add to our main routes array
    if (addToRoutes) {
      that.routes.push(reactRoute);
    }
  }

  checkChildRoutes(route);
  // console.log(this.routes[0].childRoutes);

  // add route to server

  // if we have multiple arguments
  // it means this is a parent
  // if (args.length > 1) {
  //   var childRoutes = args.splice(1), child;
  //
  //   route = ReactRouter.createRoute(options);
  //   routes.push(route);
  //
  //   _.each(childRoutes, function(childRoute) {
  //     // format route before adding to server
  //     child = childRoute;
  //     child.parentRoutePath = route.path;
  //     that.trigger('route:add', child);
  //
  //     // add route to react
  //     childRoute.parentRoute = route;
  //     ReactRouter.createRoute(childRoute);
  //   });
  // }

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
