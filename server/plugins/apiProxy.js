exports.register = function(server, options, next) {

  var handler = function handler(request, reply) {
    reply.proxy({
      host: options.host,
      port: options.port,
      protocol: options.protocol,
      passThrough: true,
      xforward: true,
      onResponse: function(err, res, request, reply, settings, ttl) {
        reply(res);
      }
    });
  }

  server.route({
    path: options.apiPrefix + '/{p*}',
    method: 'GET',
    handler: handler
  });

  server.route({
    path: options.apiPrefix + '/{p*}',
    method: ['POST', 'PUT', 'PATCH', 'DELETE'],
    config: {
      payload: {
        output: 'data',
        parse: false
      }
    },
    handler: handler
  });

  next();

}

exports.register.attributes = {
  name: 'ApiProxy',
  version: '1.0.0'
}
