var spawn  = require('child_process').spawn
var Stream = require('stream')

var async = require('async')

var ast2js = require('./index')


function noop(){}

function spawnStream(command, argv, options)
{
  var cp = spawn(command, argv, options)

  var stdin  = cp.stdin
  var stdout = cp.stdout
  var stderr = cp.sterr

  var result

  // Both `stdin` and `stdout` are open, probably the normal case.
  // Create a `Duplex` object with them so command can be used as a filter.
  if(stdin && stdout)
  {
    result = Stream.Duplex()
    result._read = noop
    result._write = function(chunk, encoding, next)
    {
      stdin.write(chunk)
      next()
    }

    stdout
    .on('data', result.push.bind(result))
    .on('end' , result.emit.bind(result,'end'))
  }

  // Only one of `stdin` or `stdout` are open, use it directly.
  else if(stdin)  result = stdin
  else if(stdout) result = stdout

  // Both `stdin` and `stdout` are clossed.
  // This should never happen, but who knows...
  else result = new Stream()

  // Expose `stderr` so it can be used later.
  if(stderr) result.stderr = stderr

  cp.on('error', result.emit.bind(result, 'error'))
  cp.on('exit' , result.emit.bind(result, 'exit' ))

  return result
}


function command(item, callback)
{
  // Command
  ast2js(item.command, function(error, command)
  {
    if(error) return callback(error)

    // Arguments
    async.map(item.args, ast2js, function(error, argv)
    {
      if(error) return callback(error)

      // Redirects
      var stdio = []

      async.eachSeries(item.redirects, function(redirect, callback)
      {
        ast2js(redirect, function(error, value)
        {
          if(error) return callback(error)

          var type = redirect.type
          switch(type)
          {
            case 'duplicateFd':
              stdio[redirect.destFd] = stdio[redirect.srcFd]
            break;

            case 'redirectFd':
              stdio[redirect.fd] = value
            break;

            case 'moveFd':
              stdio[redirect.dest] = stdio[redirect.fd]
              stdio[redirect.fd]   = 'ignore'
            break;

            default:
              return callback('Unknown redirect type "'+type+'"')
          }

          callback()
        })
      },

      // Create command
      function(error)
      {
        if(error) return callback(error)

        var env = item.env
        env.__proto__ = process.env

        var options =
        {
          env:   env,
          stdio: stdio
        }

        callback(null, spawnStream(command, argv, options))
      })
    })
  })
}


module.exports = command
