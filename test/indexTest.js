const sinon = require('sinon');
const expect = require('chai').expect;
const describe = require('mocha').describe;
const it = require('mocha').it;

describe('asyncmw', () => {

    const asyncmw = require('../index');

    it('Is a function', () => {
        expect(asyncmw).to.be.a('function');
    });

    it('Accepts a function and returns a function', () => {
        expect(asyncmw(sinon.spy())).to.be.a('function');
    });

    it('Throws if given something that is not a function', () => {
        expect(asyncmw).to.throw(Error);
        expect(() => asyncmw([])).to.throw(Error);
        expect(() => asyncmw({})).to.throw(Error);
    });

    it('Calls the wrapped function with all arguments if called without any callback', () => {
        const wrapped = sinon.spy();

        asyncmw(wrapped)('a', 1, 2);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Calls the wrapped function with all arguments except callback if called with callback', () => {
        const wrapped = sinon.spy();

        const next = sinon.spy();
        asyncmw(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Invokes callback after simple function returns', () => {
        const wrapped = sinon.stub().returns('Test result');

        const next = sinon.spy();
        asyncmw(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
        sinon.assert.calledOnce(next);
        sinon.assert.calledWith(next);
    });

    it('Invokes callback with error after simple function throws', () => {
        const err = new Error('Test error');
        const wrapped = sinon.stub().throws(err);

        const next = sinon.spy();
        asyncmw(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
        sinon.assert.calledOnce(next);
        sinon.assert.calledWith(next, err);
    });

    it('Invokes callback after promisfied function resolves', (done) => {
        const wrapped = sinon.stub().resolves('Test Result');

        const next = sinon.spy(() => {
            sinon.assert.calledOnce(next);
            sinon.assert.calledWith(next);
            done();
        });

        asyncmw(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Invokes callback with error after promisfied function rejects', (done) => {
        const err = new Error('Test error');
        const wrapped = sinon.stub().rejects(err);

        const next = sinon.spy(() => {
            sinon.assert.calledOnce(next);
            sinon.assert.calledWith(next, err);
            done();
        });

        asyncmw(wrapped)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Invokes callback after async function returns', (done) => {
        const wrapped = sinon.spy();
        const wrappedAsync = async function(){
            wrapped.apply(wrapped,arguments);
            return 'Test Result';
        }

        const next = sinon.spy(() => {
            sinon.assert.calledOnce(next);
            sinon.assert.calledWith(next);
            done();
        });

        asyncmw(wrappedAsync)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

    it('Invokes callback with error after async function throws', (done) => {
        const err = new Error('Test error');
        const wrapped = sinon.spy();
        const wrappedAsync = async function(){
            wrapped.apply(wrapped,arguments);
            throw err;
        }

        const next = sinon.spy(() => {
            sinon.assert.calledOnce(next);
            sinon.assert.calledWith(next, err);
            done();
        });

        asyncmw(wrappedAsync)('a', 1, 2, next);
        sinon.assert.calledOnce(wrapped);
        sinon.assert.calledWith(wrapped, 'a', 1, 2);
    });

});