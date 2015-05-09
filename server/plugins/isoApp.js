var React = require('react');
var ReactRouter = require('react-router');
var fetcher = require('../../shared/fetcher');

exports.register = function(server, options, next) {

  // need to set the baseUrl, otherwise fetching relative paths
  // fail on initial page load
  fetcher.setBaseUrl(server.info);

  console.log(options.serverRoutesObj);

  server.ext('onPreHandler', function(request, reply) {
    // Make sure we're calling the ReactRouter on an actual react path,
    // not an asset path or some other resource
    if (options.serverRoutePaths.indexOf(request.route.path) === -1) {
      reply.continue();
    }
    else {
      // React-Router-Component functionality
      var routes = options.serverRoutesObj[request.route.path];

      fetcher.fetchData(routes, request.params).then(function(data) {
        var Handler = options.serverRoutesObj.main_component.handler;
        console.log(data);
        var markup = React.renderToString(React.createFactory(Handler)({ path: request.route.path, data: data, params: request.params }));
        // attach the markup and initial data to the
        // request object to be used with templates
        request.app.body = markup;
        request.app.appData = data;
        reply.continue();
      });


        
      // if (Handler.fetchData && typeof Handler.fetchData === 'function') {
      //   Handler.fetchData().then(function(data) {
      //     var markup = React.renderToString(React.createFactory(Handler)({ path: request.route.path, data: data }));
      //     // attach the markup and initial data to the
      //     // request object to be used with templates
      //     request.app.body = markup;
      //     request.app.appData = data;
      //     reply.continue();
      //   });
      // }
      // else {
      //   markup = React.renderToString(React.createFactory(Handler)({ path: request.route.path }));
      //   // attach the markup and initial data to the
      //   // request object to be used with templates
      //   request.app.body = markup;
      //   request.app.appData = data;
      //   reply.continue();
      // }




      // // React-Router functionality
      // ReactRouter.run(options.reactRoutes, request.path, function(Handler, state) {
      //   fetcher.fetchData(state.routes, state.params).then(function(data) {
      //     var markup = React.renderToString(React.createFactory(Handler)({ data: data }));
      //     // attach the markup and initial data to the
      //     // request object to be used with templates
      //     request.app.body = markup;
      //     request.app.appData = data;
      //     reply.continue();
      //   });
      // });
    }
  });

  next();
}

exports.register.attributes = {
  name: 'IsoApp',
  version: '1.0.0'
}
