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

      it('should create one listener per original event', function() {
        Events.on('test', fnSpy);
        expect(Events._listeners).to.have.a.property('test');
        expect(Object.keys(Events._listeners).length).to.equal(1);
        Events.on('test', fnSpy);
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
      it('should remove an exact event listener', function() {
      });

      it('should remove all listeners under certain event', function() {
      });
    });

    describe('#trigger()', function() {
      it('should call exact event', function() {
      });

      it('should call all parent events', function() {
      });
    });
  });

});
