var assert      = require('assert')
var PassThrough = require('stream').PassThrough
var tty         = require('tty')

var spawnStream = require('./lib/ast2js/_spawnStream')


describe('spawnStream', function()
{
  it('no pipes', function()
  {
    var result = spawnStream('ls')

    assert.strictEqual(result.constructor.name, 'Duplex')
    assert.ok(result.readable)
    assert.ok(result.writable)
  })

  describe('pipe regular streams', function()
  {
    it('stdin', function()
    {
      var stdio = [new PassThrough()]

      var result = spawnStream('ls', {stdio: stdio})

      assert.strictEqual(result.constructor.name, 'Socket')
      assert.ok(result.readable)
      assert.ok(!result.writable)
    })

    it('stdout', function()
    {
      var stdio = [null, new PassThrough()]

      var result = spawnStream('ls', {stdio: stdio})

      assert.strictEqual(result.constructor.name, 'Socket')
      assert.ok(!result.readable)
      assert.ok(result.writable)
    })

    it('fully piped', function()
    {
      var stdio = [new PassThrough(), new PassThrough()]

      var result = spawnStream('ls', {stdio: stdio})

      assert.strictEqual(result.constructor.name, 'EventEmitter')
      assert.ok(!result.readable)
      assert.ok(!result.writable)
    })
  })

  describe('pipe handler streams', function()
  {
    it('stdin', function()
    {
      var stdio = [new tty.ReadStream()]

      var result = spawnStream('ls', {stdio: stdio})

      assert.strictEqual(result.constructor.name, 'Socket')
      assert.ok(result.readable)
      assert.ok(!result.writable)
    })

    it('stdout', function()
    {
      var stdio = [null, new tty.WriteStream()]

      var result = spawnStream('ls', {stdio: stdio})

      assert.strictEqual(result.constructor.name, 'Socket')
      assert.ok(!result.readable)
      assert.ok(result.writable)
    })

    it('fully piped', function()
    {
      var stdio = [new tty.ReadStream(), new tty.WriteStream()]

      var result = spawnStream('ls', {stdio: stdio})

      assert.strictEqual(result.constructor.name, 'EventEmitter')
      assert.ok(!result.readable)
      assert.ok(!result.writable)
    })
  })
})


// if('inception', function()
// {
//
// })
