var React = require('react');
var ReactAddons = require('react/addons');
var ReactRouter = require('react-router');
var RouteHandler = ReactRouter.RouteHandler;
var Link = ReactRouter.Link;

var ReactionRouter = require('./shared/router');
var Fetcher = require('./shared/fetcher');
var Route = require('./shared/components/Route');
var DefaultRoute = require('./shared/components/DefaultRoute');
var NotFoundRoute = require('./shared/components/NotFoundRoute');
var Redirect = require('./shared/components/Redirect');
var Prefetch = require('./shared/components/Prefetch');
var isServer = (typeof window === 'undefined') ? true : false;

exports.React = React;

exports.ReactAddons = ReactAddons;

exports.ReactRouter = ReactRouter;

exports.RouteHandler = RouteHandler;

exports.Link = Link;

exports.Route = Route;

exports.DefaultRoute = DefaultRoute;

exports.NotFoundRoute = NotFoundRoute;

exports.Redirect = Redirect;

exports.Prefetch = Prefetch;

exports.route = React.createFactory(Route);

exports.defaultRoute = React.createFactory(DefaultRoute);

exports.notFoundRoute = React.createFactory(NotFoundRoute);

exports.redirect = React.createFactory(Redirect);

exports.preFetch = React.createFactory(Prefetch);

exports.Fetcher = Fetcher;

exports.Router = function(options) {
  return new ReactionRouter(options);
};

exports.attachApp = function(options, serverInstance) {
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
