var assert = require('assert')
var tty    = require('tty')

var concat = require('concat-stream')
var str    = require('string-to-stream')

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

    var stdout = concat(function(data)
    {
      expected.shift()
      expected = expected.join('\n')

      assert.strictEqual(data.toString(), expected+'\n')

      done()
    })

    var grep = spawnStream('grep', ['b'], {stdio: [null, stdout]})

    assert.strictEqual(grep.constructor.name, 'Writable')
    assert.ok(!grep.readable)
    assert.ok(grep.writable)

    var argv = ['-e', expected.join('\\n')]

    var echo = spawnStream('echo', argv, {stdio: [null, grep]})

    assert.strictEqual(echo.constructor.name, 'Writable')
    assert.ok(!echo.readable)
    assert.ok(echo.writable)
  })

  describe('pipe regular streams', function()
  {
    it('stdin', function(done)
    {
      var expected = ['aa','ab','bb']

      var stdin = str(expected.join('\n'))

      var grep = spawnStream('grep', ['b'], {stdio: [stdin]})

      assert.strictEqual(grep.constructor.name, 'Socket')
      assert.ok(grep.readable)
      assert.ok(!grep.writable)

      grep.pipe(concat(function(data)
      {
        expected.shift()
        expected = expected.join('\n')

        assert.strictEqual(data.toString(), expected+'\n')
      }))

      grep.on('end', done)
    })

    it('stdout', function(done)
    {
      var expected = 'asdf'

      var stdout = concat(function(data)
      {
        assert.strictEqual(data.toString(), expected+'\n')
      })

      var echo = spawnStream('echo', [expected], {stdio: [null, stdout]})

      assert.strictEqual(echo.constructor.name, 'Writable')
      assert.ok(!echo.readable)
      assert.ok(echo.writable)

      echo.on('end', done)
    })

    it('fully piped', function(done)
    {
      var expected = ['aa','ab','bb']

      var stdin  = str(expected.join('\n'))
      var stdout = concat(function(data)
      {
        expected.shift()
        expected = expected.join('\n')

        assert.strictEqual(data.toString(), expected+'\n')
      })

      var grep = spawnStream('grep', ['b'], {stdio: [stdin, stdout]})

      assert.strictEqual(grep.constructor.name, 'EventEmitter')
      assert.ok(!grep.readable)
      assert.ok(!grep.writable)

      grep.on('end', done)
    })
  })

  describe('pipe handler streams', function()
  {
    it('stdin', function(done)
    {
      var stdin = new tty.ReadStream()

      var result = spawnStream('ls', {stdio: [stdin]})

      assert.strictEqual(result.constructor.name, 'Socket')
      assert.ok(result.readable)
      assert.ok(!result.writable)

      stdin.on('end', function(){
        console.log('***end***')
      })
      stdin.on('finish', function(){
        console.log('***finish***')
      })
      result.on('end', function()
      {
        console.log('***end 2***')
        stdin.end()

        done()
      })
    })

    it('stdout', function(done)
    {
      var stdout = new tty.WriteStream()

      var result = spawnStream('ls', {stdio: [null, stdout]})

      assert.strictEqual(result.constructor.name, 'Writable')
      assert.ok(!result.readable)
      assert.ok(result.writable)

      result.on('end', function()
      {

        done()
      })
    })

    it('fully piped', function(done)
    {
      var stdin  = new tty.ReadStream()
      var stdout = new tty.WriteStream()

      var result = spawnStream('ls', {stdio: [stdin, stdout]})

      assert.strictEqual(result.constructor.name, 'EventEmitter')
      assert.ok(!result.readable)
      assert.ok(!result.writable)

      result.on('end', function()
      {

        done()
      })
    })
  })
})


// describe('command', function()
// {
//   it('', function(done)
//   {
//     var item =
//     {
//       command:,
//       args: [],
//       stdio:,
//       redirects: [],
//       env: {}
//     }
//
//     command(item, function(command)
//     {
//
//     })
//   })
// })

// if('inception', function()
// {
//
// })
