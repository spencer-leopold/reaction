var React = require('react');
var ReactAddons = require('react/addons');
var ReactRouter = require('react-router');
var RouteHandler = ReactRouter.RouteHandler;
var Link = ReactRouter.Link;

var ReactionRouter = require('./shared/router');
var Route = require('./shared/components/Route');
var DefaultRoute = require('./shared/components/DefaultRoute');
var NotFoundRoute = require('./shared/components/NotFoundRoute');
var Redirect = require('./shared/components/Redirect');
var Prefetch = require('./shared/components/Prefetch');
var isServer = (typeof window === 'undefined') ? true : false;

module.exports = {
  React: React,
  ReactAddons: ReactAddons,
  ReactRouter: ReactRouter,
  RouteHandler: RouteHandler,
  Link: Link,
  Route: Route,
  DefaultRoute: DefaultRoute,
  NotFoundRoute: NotFoundRoute,
  Redirect: Redirect,
  Prefetch: Prefetch,
  Router: function(options) {
    return new ReactionRouter(options);
  },
  attachApp: function(options, serverInstance) {
    var Server;

    if (serverInstance.response) {
      var expressRoute = './server/expressServer';
      Server = require(expressRoute);
    }
    else {
      var hapiRoute = './server/hapiServer';
      Server = require(hapiRoute);
    }

    return new Server(options, serverInstance);
  }
}
