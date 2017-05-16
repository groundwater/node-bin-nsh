const assert = require('assert')
const fs     = require('fs')
const tty    = require('tty')

const concat = require('concat-stream')
const str    = require('string-to-stream')
const tmp    = require('tmp').file

const spawnStream = require('../lib/ast2js/_spawnStream')


describe('spawnStream', function()
{
  it('no pipes', function(done)
  {
    var expected = ['aa','ab','bb']

    const stdin  = str(expected.join('\n'))
    const stdout = concat(function(data)
    {
      expected.shift()
      expected = expected.join('\n')

      assert.strictEqual(data.toString(), expected)
    })

    const result = spawnStream('grep', ['b'])

    assert.strictEqual(result.constructor.name, 'Duplex')
    assert.ok(result.readable)
    assert.ok(result.writable)

    stdin.pipe(result).pipe(stdout)

    result.on('end', done)
  })

  it('ignore stdio', function()
  {
    var stdio = ['ignore', 'ignore']

    var result = spawnStream('ls', {stdio: stdio})

    assert.strictEqual(result.constructor.name, 'EventEmitter')
    assert.ok(!result.readable)
    assert.ok(!result.writable)
  })

  it('set a command as `stdin` of another', function(done)
  {
    var expected = ['aa','ab','bb']

    const argv = [expected.join('\n'), '-e']
    const echo = spawnStream('echo', argv, {stdio: ['ignore']})

    assert.strictEqual(echo.constructor.name, 'Readable')
    assert.ok(echo.readable)
    assert.ok(!echo.writable)

    const stdout = concat(function(data)
    {
      expected.shift()
      expected = expected.join('\n')

      assert.strictEqual(data.toString(), expected+'\n')

      done()
    })

    const grep = spawnStream('grep', ['b'], {stdio: [echo, stdout]})

    assert.strictEqual(grep.constructor.name, 'EventEmitter')
    assert.ok(!grep.readable)
    assert.ok(!grep.writable)
  })

  it('set a command as `stdout` of another', function(done)
  {
    var expected = ['aa','ab','bb']

    const stdout = concat(function(data)
    {
      expected.shift()
      expected = expected.join('\n')

      assert.strictEqual(data.toString(), expected+'\n')

      done()
    })

    const grep = spawnStream('grep', ['b'], {stdio: [null, stdout]})

    assert.strictEqual(grep.constructor.name, 'Writable')
    assert.ok(!grep.readable)
    assert.ok(grep.writable)

    const argv = [expected.join('\n'), '-e']
    const echo = spawnStream('echo', argv, {stdio: ['ignore', grep]})

    assert.strictEqual(echo.constructor.name, 'EventEmitter')
    assert.ok(!echo.readable)
    assert.ok(!echo.writable)

    echo.stderr.pipe(process.stderr)
  })

  describe('pipe regular streams', function()
  {
    it('pipe stdin', function(done)
    {
      var expected = ['aa','ab','bb']

      const stdin = str(expected.join('\n'))
      const stdout = concat(function(data)
      {
        expected.shift()
        expected = expected.join('\n')

        assert.strictEqual(data.toString(), expected)

        done()
      })

      const grep = spawnStream('grep', ['b'], {stdio: [stdin]})

      assert.strictEqual(grep.constructor.name, 'Readable')
      assert.ok(grep.readable)
      assert.ok(!grep.writable)

      grep.pipe(stdout)
    })

    it('pipe stdout', function(done)
    {
      const expected = 'asdf'

      const stdout = concat(function(data)
      {
        assert.strictEqual(data.toString(), expected+'\n')

        done()
      })

      const echo = spawnStream('echo', [expected], {stdio: [null, stdout]})

      assert.strictEqual(echo.constructor.name, 'Writable')
      assert.ok(!echo.readable)
      assert.ok(echo.writable)

      echo.stderr.pipe(process.stderr)
    })

    it('fully piped', function(done)
    {
      var expected = ['aa','ab','bb']

      const stdin  = str(expected.join('\n'))
      const stdout = concat(function(data)
      {
        expected.shift()
        expected = expected.join('\n')

        assert.strictEqual(data.toString(), expected)

        done()
      })

      var grep = spawnStream('grep', ['b'], {stdio: [stdin, stdout]})

      assert.strictEqual(grep.constructor.name, 'EventEmitter')
      assert.ok(!grep.readable)
      assert.ok(!grep.writable)
    })
  })

  describe('pipe handler streams', function()
  {
    it('pipe stdin', function(done)
    {
      const expected = 'asdf'

      var stdin = new tty.ReadStream()
      const stdout = concat(function(data)
      {
        expected.shift()
        expected = expected.join('\n')

        assert.strictEqual(data.toString(), expected)

        done()
      })

      var result = spawnStream('ls', {stdio: [stdin]})

      assert.strictEqual(result.constructor.name, 'Readable')
      assert.ok(result.readable)
      assert.ok(!result.writable)

      result.resume()
      result.on('end', done)
    })

    it('pipe stdout', function(done)
    {
      const expected = 'asdf'

      const stdout = new tty.WriteStream()

      const echo = spawnStream('echo', [expected], {stdio: [null, stdout]})

      assert.strictEqual(echo.constructor.name, 'Writable')
      assert.ok(!echo.readable)
      assert.ok(echo.writable)

      echo.on('end', done)
    })

    it('fully piped', function(done)
    {
      const stdin  = new tty.ReadStream()
      const stdout = new tty.WriteStream()

      const result = spawnStream('ls', {stdio: [stdin, stdout]})

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

describe('file descriptors', function()
{
  it('pipe stdin', function(done)
  {
    fs.open('test/fixture.txt', 'r', function(err, fd)
    {
      if(err) return done(err)

      function clean(err1)
      {
        fs.close(fd, function(err2)
        {
          done(err1 || err2)
        })
      }

      const expected = 'asdf'

      const stdout = concat(function(data)
      {
        assert.strictEqual(data.toString(), expected+'\n')

        clean()
      })

      const echo = spawnStream('echo', [expected], {stdio: [fd]})

      assert.strictEqual(echo.constructor.name, 'Readable')
      assert.ok(echo.readable)
      assert.ok(!echo.writable)

      echo.pipe(stdout)
    })
  })

  it('pipe stdout', function(done)
  {
    const expected = 'asdf'

    tmp(function(err, path, fd, cleanupCallback)
    {
      if(err) return done(err)

      function clean(err)
      {
        cleanupCallback()
        done(err)
      }

      const echo = spawnStream('echo', [expected], {stdio: [null, fd]})

      assert.strictEqual(echo.constructor.name, 'Writable')
      assert.ok(!echo.readable)
      assert.ok(echo.writable)

      echo.on('end', function()
      {
        fs.readFile(path, 'utf-8', function(err, data)
        {
          if(err) return clean(err)

          assert.strictEqual(data, expected+'\n')

          clean()
        })
      })
    })
  })

  it('fully piped', function(done)
  {
    fs.open('test/fixture.txt', 'r', function(err, fdStdin)
    {
      if(err) return done(err)

      function clean1(err1)
      {
        fs.close(fdStdin, function(err2)
        {
          done(err1 || err2)
        })
      }

      tmp(function(err, path, fdStdout, cleanupCallback)
      {
        if(err) return clean1(err)

        function clean2(err)
        {
          cleanupCallback()
          clean1(err)
        }

        const expected = 'asdf'

        const stdio = [fdStdin, fdStdout]
        const echo = spawnStream('echo', [expected], {stdio})

        assert.strictEqual(echo.constructor.name, 'EventEmitter')
        assert.ok(!echo.readable)
        assert.ok(!echo.writable)

        echo.on('end', function()
        {
          fs.readFile(path, 'utf-8', function(err, data)
          {
            if(err) return clean2(err)

            assert.strictEqual(data, expected+'\n')

            clean2()
          })
        })
      })
    })
  })
})


// describe('command', function()
// {
//   it('', function(done)
//   {
//     const item =
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
