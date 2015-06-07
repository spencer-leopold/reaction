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

  if (options.serverAdapter) {
    Server = require(options.serverAdapter);
  }
  else {
    // Use variables to require adapter modules so they
    // don't get bundled by browserify
    if (serverInstance.response) {
      var expressAdapter = './server/expressAdapter';
      Server = require(expressAdapter);
    }
    else {
      var hapiAdapter = './server/hapiAdapter';
      Server = require(hapiAdapter);
    }
  }

  return new Server(options, serverInstance);
}
