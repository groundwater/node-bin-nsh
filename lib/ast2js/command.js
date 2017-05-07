const Domain   = require('domain').Domain
const Duplex   = require('stream').Duplex
const Readable = require('stream').Readable

const flatten        = require('array-flatten')
const map            = require('async').map
const ToStringStream = require('to-string-stream')

const ast2js      = require('./index')
const redirects   = require('./_redirects')
const spawnStream = require('./_spawnStream')

const builtins = require('../builtins')


function noop(){}

function wrapStdio(command, argv, options)
{
  var stdio = options.stdio

  var stdin  = stdio[0]
  var stdout = stdio[1]
  var stderr = stdio[2]

  // Create a `stderr` stream for `error` events if none is defined
  if(stderr === 'pipe')
  {
    stderr = new Readable({objectMode: true})
    stderr._read = noop
  }


  // Put `error` events on the `stderr` stream
  var d = new Domain()
  .on('error', stderr.push.bind(stderr))
  // [ToDo] Close `stderr` when command finish

  // Run the builtin command
  command = d.run(command.bind(options.env), argv)

  // TODO stdin === 'ignore'
  if(stdin !== 'pipe')
  {
    if(command.writeable)
      stdin.pipe(command)

    stdin = null
  }

  // TODO stdout === 'ignore'
  if(stdout !== 'pipe')
  {
    if(command.readable)
    {
      if(stdout.objectMode)
        command.pipe(stdout)
      else
        command.pipe(new ToStringStream()).pipe(stdout)
    }

    stdout = null
  }

  var result

  // TODO Check exactly what values can be `stdin` and `stdout`, probably we
  //      have here a lot of garbage code
  if(stdin && stdout)
  {
    result = Duplex()
    result._read  = noop
    result._write = stdin.write.bind(stdin)

    result.on('finish', stdin.end.bind(stdin))

    stdout
    .on('data', result.push.bind(result))
    .on('end' , result.emit.bind(result, 'end'))
  }

  else if(stdin)
  {
    result = stdin

    command.once('finish', result.emit.bind(result, 'end'))
  }

  else if(stdout)
  {
    result = command

    stdout.once('end', result.emit.bind(result, 'end'))
  }

  else
    result = command

  // Expose `stderr` so it can be used later.
  if(stderr !== stdio[2]) result.stderr = stderr

  // Emulate process events
  result.once('end', result.emit.bind(result, 'exit', 0, null))

  return result
}


function command(item, callback)
{
  // Command
  ast2js(item.command, function(error, command)
  {
    if(error) return callback(error)

    // Arguments
    map(item.args, ast2js, function(error, argv)
    {
      if(error) return callback(error)

      // Globs return an array, flat it
      argv = flatten(argv)

      // Redirects
      redirects(item.stdio, item.redirects, function(error, stdio)
      {
        if(error) return callback(error)

        // Create command
        var env = item.env
        env.__proto__ = process.env

        var options =
        {
          env:   env,
          stdio: stdio
        }

        // Builtins
        var builtin = builtins[command]
        if(builtin) return callback(null, wrapStdio(builtin, argv, options))

        // External commands
        try
        {
          command = spawnStream(command, argv, options)
        }
        catch(error)
        {
          if(error.code === 'EACCES') error = command+': is a directory'

          return callback(error)
        }

        callback(null, command)
      })
    })
  })
}


module.exports = command
