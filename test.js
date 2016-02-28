var assert      = require('assert')
var PassThrough = require('stream').PassThrough
var tty         = require('tty')

var concat = require('concat-stream')

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

  it('ignore stdio', function()
  {
    var stdio = ['ignore', 'ignore']

    var result = spawnStream('ls', {stdio: stdio})

    assert.strictEqual(result.constructor.name, 'EventEmitter')
    assert.ok(!result.readable)
    assert.ok(!result.writable)
  })

  it('pipe two commands between them', function(done)
  {
    var expected = ['aa','ab','bb']

    var stdio = [null, concat(function(data)
    {
      expected.shift()
      expected = expected.join('\n')

      assert.strictEqual(data.toString(), expected+'\n')

      done()
    })]

    var grep = spawnStream('grep', ['b'], {stdio: stdio})

    assert.strictEqual(grep.constructor.name, 'Socket')
    assert.ok(!grep.readable)
    assert.ok(grep.writable)

    var argv = ['-e', expected.join('\\n')]

    var echo = spawnStream('echo', argv, {stdio: [null, grep]})

    assert.strictEqual(echo.constructor.name, 'Socket')
    assert.ok(!echo.readable)
    assert.ok(echo.writable)
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

    it('stdout', function(done)
    {
      var expected = 'asdf'

      var stdio = [null, concat(function(data)
      {
        assert.strictEqual(data.toString(), expected+'\n')

        done()
      })]

      var result = spawnStream('echo', [expected], {stdio: stdio})

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
