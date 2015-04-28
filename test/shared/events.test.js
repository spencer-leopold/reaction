var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Events = require('../../shared/events');
var should = chai.should();

chai.use(sinonChai);

describe('shared/events', function() {

  describe('EventsDispatcher', function() {
    describe('#on()', function() {
      it('should create a new listener', function() {
      });
    });

    describe('#remove()', function() {
      it('should remove a listener', function() {
      });
    });

    describe('#trigger()', function() {
      it('should call all listening events', function() {
      });
    });
  });

  describe('Dispatcher', function() {
    describe('getInstance', function() {
      it('should create one instance', function() {
      });

      it('should return the same instance', function() {
      });
    });
  });

});
