var Domain   = require('domain').Domain
var Duplex   = require('stream').Duplex
var Readable = require('stream').Readable

var flatten = require('array-flatten')
var map     = require('async').map

var ast2js      = require('./index')
var redirects   = require('./_redirects')
var spawnStream = require('./_spawnStream')

var builtins = require('../builtins')


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
  d.run(function()
  {
    command = command.call(options.env, argv)
  })


  // [ToDo] stdin === 'ignore'
  if(stdin !== 'pipe')
    stdin.pipe(command)
  else
    stdin = null

  // [ToDo] stdout === 'ignore'
  if(stdout !== 'pipe')
    command.pipe(stdout)
  else
    stdout = null

  var result

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

    var event = command.readable ? 'end' : 'finish'
    command.on(event, result.emit.bind(result, 'end'))
  }

  else if(stdout)
  {
    result = command

    var event = stdout.readable ? 'end' : 'finish'
    stdout.on(event, result.emit.bind(result, 'end'))
  }

  else
    result = command

  result.once('end', result.emit.bind(result, 'exit', 0, null))

  // Expose `stderr` so it can be used later.
  if(stderr !== stdio[2]) result.stderr = stderr

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
      redirects(item.output, item.redirects, function(error, stdio)
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
