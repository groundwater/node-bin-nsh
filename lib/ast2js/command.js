var spawn  = require('child_process').spawn
var Stream = require('stream')

var map = require('async').map

var ast2js    = require('./index')
var redirects = require('./redirects')


function noop(){}

function spawnStream(command, argv, options)
{
  var cp = spawn(command, argv, options)

  var stdin  = options.stdio[0]
  var stdout = options.stdio[1]
  var stderr = options.stdio[2]

  stdin  = cp.stdin  || (stdin  !== 'ignore' && stdin .writable ? stdin  : null)
  stdout = cp.stdout || (stdout !== 'ignore' && stdout.readable ? stdout : null)
  stderr = cp.stderr || (stderr !== 'ignore' && stderr.readable ? stderr : null)

  var result

  // Both `stdin` and `stdout` are open, probably the normal case.
  // Create a `Duplex` object with them so command can be used as a filter.
  if(stdin && stdout)
  {
    result = Stream.Duplex()
    result._read  = noop
    result._write = stdin.write.bind(stdin)

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
