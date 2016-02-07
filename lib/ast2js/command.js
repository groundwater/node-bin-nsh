var Domain   = require('domain').Domain
var Duplex   = require('stream').Duplex
var Readable = require('stream').Readable

var map = require('async').map

var ast2js      = require('./index')
var redirects   = require('./_redirects')
var spawnStream = require('./_spawnStream')

var builtins = require('../builtins')


function noop(){}

function connectStdio(command, stdio)
{
  var stdin  = stdio[0]
  var stdout = stdio[1]

  if(stdin !== 'pipe')
    stdin.pipe(command)
  else
    stdin = null

  if(stdout !== 'pipe')
    command.pipe(stdout)
  else
    stdout = null

  var result = command

  if(stdin || stdout)
  {
    stdin  = stdin  || command
    stdout = stdout || command

    result = Duplex()
    result._read  = noop
    result._write = stdin.write.bind(stdin)

    result.on('finish', stdin.end.bind(stdin))

    stdout
    .on('data', result.push.bind(result))
    .on('end' , result.emit.bind(result, 'end'))
    .on('end' , result.emit.bind(result, 'exit', 0, null))
  }

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

      // Redirects
      redirects(item.redirects, function(error, stdio)
      {
        if(error) return callback(error)

        // Create command
        var env = item.env
        env.__proto__ = process.env

        var builtin = builtins[command]
        if(builtin)
        {
          var d = new Domain()

          // Put `error` events on the `stderr` stream
          var stderr = stdio[2]
          if(stderr === 'pipe')
          {
            stderr = new Readable({objectMode: true})
            stderr._read = noop
          }

          d.on('error', stderr.push.bind(stderr))
          // [ToDo] Close `stderr` when command finish

          // Run the builtin
          d.run(function()
          {
            command = builtin.call(env, argv)
          })

          // Expose `stderr` so it can be used later.
          if(stderr !== stdio[2]) command.stderr = stderr

          return callback(null, connectStdio(command, stdio))
        }

        var options =
        {
          env:   env,
          stdio: stdio
        }

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
