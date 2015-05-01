var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Router = require('../../shared/router');
var should = chai.should();
var expect = chai.expect;

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
            componentsDir: 'app/components'
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

  describe('router instance', function() {
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

    describe('#getRouteBuilder()', function() {
    });

    describe('#addRouteDefinition()', function() {
    });

    describe('#start()', function() {
    });
  });
});
