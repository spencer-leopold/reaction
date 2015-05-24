var React = require('react');
var Route = require('./Route');
var DefaultRoute = require('./DefaultRoute');
var NotFoundRoute = require('./NotFoundRoute');
var Redirect = require('./Redirect');
var Prefetch = require('./Prefetch');

module.exports = {
  route: React.createFactory(Route),
  defaultRoute: React.createFactory(DefaultRoute),
  notFoundRoute: React.createFactory(NotFoundRoute),
  redirect: React.createFactory(Redirect),
  preFetch: React.createFactory(Prefetch)
}
