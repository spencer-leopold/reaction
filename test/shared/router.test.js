var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Router = require('../../shared/router');
var should = chai.should();

chai.use(sinonChai);

describe('shared/router', function() {
  describe('initialization', function() {
    var testCases = [
      {
        options: { entryPath: '' },
        expectedOptions: {
          entryPath: '',
          paths: {
            entryPath: '',
            routes: 'app/routes',
            componentsDir: 'app/components',
            templatesDir: 'app/templates'
          }
        }
      }
    ];

    testCases.forEach(function(testCase) {
      it('should initialize the paths options', function() {
        var router = new Router(testCase.options)
        router.options.should.be.deep.equal(testCase.expectedOptions);
      });
    });
  });

  describe('Router instance', function() {
    var router;

    beforeEach(function() {
      router = new Router({ entryPath: 'TestApp/' });
    });

    describe('#getComponentPath()', function() {
      it('should return correct component path', function() {
        var path = router.getComponentPath('App');
        path.should.be.equal('TestApp/app/components/App');
      });
    });

    describe('#loadComponent()', function() {
      it('should load the component', function() {
      });
    });

    describe('#loadRoutesFromFile()', function() {
      it('should return a function', function() {
      });
    });

    describe('#prefixRoutePath()', function() {
      it('should append a mountPath to each absolute path', function() {
      });
    });

    describe('#setRoutes()', function() {
      it('should add top level routes to the instance', function() {
      });

      it('should add recurse if the route is a child route', function() {
      });
    });

    describe('#extendChildRoutes()', function() {
      it('should merge together child route objects if it the route already exists', function() {
      });
    });

    describe('#iterateComponentRoutes()', function() {
      it('should load and attach react handlers', function() {
      });
    });

    describe('#buildComponentRoutes()', function() {
      it('should call iterateComponentRoutes once if childRoute has a type', function() {
      });

      it('should call iterateComponentRoutes as many times as its length', function() {
      });
    });

    describe('#parseRoute()', function() {
      it('should remove the children key if exists', function() {
      });

      it('should set childRoutes key if it had a children key', function() {
      });

      it('should prefix the path key if a mountPath is used', function() {
      });

      it('should call buildComponentRoutes if it has childRoutes', function() {
      });
    });

    describe('#buildRoutes()', function() {
      it('should call the function returned from loadRoutesFromFile if a route file is being used', function() {
        it('should call parseRoute', function() {
        });
      });

      it('should call loadRoutesFromComponent if there are any entryPoints set', function() {
      });

      it('should call addRouteDefinition as many times as the total number of routes we have', function() {
      });
    });

    describe('#buildChildRoutePaths()', function() {
    });

    describe('#setChildRoutePath()', function() {
    });

    describe('#processRoute()', function() {
    });

    describe('#addRouteDefinition()', function() {
    });

    describe('#start()', function() {
    });
  });
});
