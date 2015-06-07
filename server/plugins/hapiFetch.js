exports.register = function(server, options, next) {
  var renderRouteData = require('../base/renderRouteData')(options);

  server.ext('onPreHandler', function(request, reply) {

    renderRouteData(request, server.info, request.route.path, reply.continue, reply);

  });

  next();
}

exports.register.attributes = {
  name: 'IsoApp',
  version: '1.0.0'
}
