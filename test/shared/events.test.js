var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Events = require('../../shared/events');
var should = chai.should();
var expect = chai.expect;

chai.use(sinonChai);

describe('shared/events', function() {

  describe('EventsDispatcher', function() {

    describe('#on()', function() {
      beforeEach(function() {
        fnSpy = sinon.spy();
      });

      afterEach(function() {
        Events.remove('test');
      });

      it('should create a new listener', function() {
        Events.on('test', fnSpy);
        expect(Events._listeners).to.have.a.property('test');
        expect(Object.keys(Events._listeners).length).to.equal(1);
      });

      it('should use the passed in context', function() {
        var ctx = {};
        Events.on('test', fnSpy, ctx);
        expect(Events._listeners).to.deep.equal({ test: [{ fn: fnSpy, ctx: ctx }] });
      });

      it('should fallback to current context', function() {
        Events.on('test', fnSpy);
        expect(Events._listeners).to.deep.equal({ test: [{ fn: fnSpy, ctx: Events }] });
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

});
