var React = require('react');
var ReactRouter = require('react-router');
var fetcher = require('../../shared/fetcher');
var url = require('url');

module.exports = function(options) {
  return function(req, res, next) {
    // Make sure we're calling the ReactRouter on an actual react path,
    // not an asset path or some other resource
    if (options.serverRoutePaths.indexOf(req.path) === -1) {
      next();
    }
    else {
      // need to set the baseUrl, otherwise fetching relative paths
      // fail on initial page load
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

      fetcher.setBaseUrl(serverInfo);

      // React-Router functionality
      ReactRouter.run(options.reactRoutes, req.path, function(Handler, state) {
        fetcher.fetchData(state.routes, state.params).then(function(data) {
          var markup = React.renderToString(React.createFactory(Handler)({ data: data }));
          // attach the markup and initial data to the
          // request object to be used with templates
          req.attributes = {};
          req.attributes.body = markup;
          req.attributes.appData = data;
          next();
        });
      });
    }
  }
}
