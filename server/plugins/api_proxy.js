exports.register = function(server, options, next) {

  server.route({
    path: options.apiPrefix + '/{p*}',
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    handler: function(request, reply) {
      reply.proxy({
        host: options.host,
        port: options.port,
        protocol: options.protocol,
        onResponse: function(err, res, request, reply, settings, ttl) {
          reply(res);
        }
      });
    }
  });

  next();

}

exports.register.attributes = {
  name: 'ApiProxy',
  version: '1.0.0'
}
