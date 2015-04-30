var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Events = require('../../shared/events');
var should = chai.should();
// var expect = chai.expect;

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
        Events._listeners.should.have.a.property('test');
        Object.keys(Events._listeners).length.should.be.equal(1);
        Events.on('test', fnSpy);
        Object.keys(Events._listeners).length.should.be.equal(1);
      });

      it('should use the passed in context', function() {
        var ctx = {};
        Events.on('test', fnSpy, ctx);
        Events._listeners.should.deep.equal({ test: [{ fn: fnSpy, ctx: ctx }] });
      });

      it('should fallback to current context', function() {
        Events.on('test', fnSpy);
        Events._listeners.should.deep.equal({ test: [{ fn: fnSpy, ctx: Events }] });
      });
    });

    describe('#remove()', function() {
      it('should remove an exact event listener', function() {
        fnSpy = sinon.spy();
        fnSpy2 = sinon.spy();
        Events.on('test', fnSpy);
        Events.remove('test', fnSpy2);
        Events._listeners.should.be.deep.equal({ test: [{ fn: fnSpy, ctx: Events }] });
        Events.remove('test', fnSpy);
        Events._listeners.should.be.deep.equal({ test: [] });
      });

      it('should remove all listeners under certain event', function() {
        fnSpy = sinon.spy();
        fnSpy2 = sinon.spy();
        Events.on('test', fnSpy);
        Events.on('test', fnSpy2);
        Object.keys(Events._listeners).length.should.be.equal(1);
        Events._listeners.test.length.should.be.equal(2);
        Events.remove('test');
        Object.keys(Events._listeners).length.should.be.equal(0);
      });
    });

    describe('#trigger()', function() {
      it('should trigger function attached to an event', function() {
        var fnSpy = sinon.spy();
        Events.on('test', fnSpy);
        Events.trigger('test');
        fnSpy.should.have.been.calledOnce;
        Events.trigger('test');
        fnSpy.should.have.been.calledTwice;
        Events.remove('test');
      });

      it('should call all parent events', function() {
        var fnSpy1 = sinon.spy();
        var fnSpy2 = sinon.spy();
        Events.on('test', fnSpy1);
        Events.on('test:scope', fnSpy2);
        Events.trigger('test:scope');
        Events.trigger('test');
        fnSpy2.should.have.been.calledOnce;
        fnSpy1.should.have.been.calledTwice;
        Events.remove('test');
        Events.remove('test:scope');
      });
    });
  });

});
