var React = require('react');
var ReactAddons = require('react/addons');
var ReactRouter = require('react-router');
var RouteHandler = ReactRouter.RouteHandler;
var Link = ReactRouter.Link;

var Route = require('./Route');
var DefaultRoute = require('./DefaultRoute');
var NotFoundRoute = require('./NotFoundRoute');
var Redirect = require('./Redirect');
var Prefetch = require('./Redirect');

module.exports = {
  React: React,
  ReactAddons: ReactAddons,
  ReactRouter: ReactRouter,
  RouteHandler: RouteHandler,
  Link: Link,
  route: React.createFactory(Route),
  defaultRoute: React.createFactory(DefaultRoute),
  notFoundRoute: React.createFactory(NotFoundRoute),
  redirect: React.createFactory(Redirect),
  preFetch: React.createFactory(Prefetch)
}
