var React = require('react');
var ReactRouter = require('react-router');
var ReactionFetcher = require('../../shared/fetcher');
var fetcher = new ReactionFetcher();
var url = require('url');

module.exports = function(options) {
  var renderRouteData = require('../base/renderRouteData')(options);

  return function(req, res, next) {

    var host = req.headers.host;
    if (host.indexOf('http://') === -1) {
      host = 'http://'+host;
    }
    var info = url.parse(host);
    var serverInfo = {
      protocol: info.protocol.replace(':', ''),
      host: info.hostname,
      port: info.port
    }

    renderRouteData(req, serverInfo, req.path, next);
  }
}
