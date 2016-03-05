var EventEmitter = require('events')
var spawn        = require('child_process').spawn
var stream       = require('stream')

var Duplex   = stream.Duplex
var Writable = stream.Writable


function noop(){}

/**
 * Node.js `spawn` only accept streams with a file descriptor as stdio, so use
 * pipes instead and connect the given streams to them.
 */
function wrapStdio(command, argv, options)
{
  argv    = argv    || []
  options = options || {}

  var stdio = options.stdio
  if(!stdio) options.stdio = stdio = []

  var stdin  = stdio[0]
  var stdout = stdio[1]
  var stderr = stdio[2]

  // Wrap stdio
  if(typeof stdin === 'string'
  || stdin && stdin.constructor.name === 'ReadStream')
    stdin = null
  else
    stdio[0] = 'pipe'

  if(typeof stdout === 'string'
  || stdout && stdout.constructor.name === 'WriteStream')
    stdout = null
  else
    stdio[1] = 'pipe'

  if(typeof stderr === 'string'
  || stderr && stderr.constructor.name === 'WriteStream')
    stderr = null
  else
    stdio[2] = 'pipe'

  // Create child process
  var cp = spawn(command, argv, options)

  // Adjust events, pipe streams and restore stdio
  if(stdin)
  {
    stdin.pipe(cp.stdin)
    cp.stdin = null
  }
  if(stdout)
  {
    cp.stdout.pipe(stdout)
    cp.stdout = null
  }
  if(stderr)
  {
    cp.stderr.pipe(stderr)
    cp.stderr = null
  }

  // Return child process
  return cp
}


function spawnStream(command, argv, options)
{
  if(argv && argv.constructor.name === 'Object')
  {
    options = argv
    argv = undefined
  }

  options = options || {}
  var stdio = options.stdio || []

  var stdin  = stdio[0]
  var stdout = stdio[1]
  var stderr = stdio[2]

  if(stdin  == null) stdin  = 'pipe'
  if(stdout == null) stdout = 'pipe'
  if(stderr == null) stderr = 'pipe'

  var cp = wrapStdio(command, argv, options)

  stdin  = (stdin  === 'pipe') ? cp.stdin  : null
  stdout = (stdout === 'pipe') ? cp.stdout : null
  stderr = (stderr === 'pipe') ? cp.stderr : null

  var result

  // Both `stdin` and `stdout` are open, probably the normal case.
  // Create a `Duplex` object with them so command can be used as a filter.
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

  // Only `stdin` is open, ensure is always 'only' writable.
  else if(stdin)
  {
    result = Writable()
    result._write = stdin.write.bind(stdin)

    result.on('finish', stdin.end.bind(stdin))
  }

  // Only `stdout` is open, use it directly.
  else if(stdout) result = stdout

  // Both `stdin` and `stdout` are clossed.
  else result = new EventEmitter()

  if(stderr)
  {
    // Expose `stderr` so it can be used later.
    result.stderr = stderr

    // Redirect `stderr` from piped command to our own `stderr`, since there's
    // no way to redirect it to `process.stderr` by default as it should be.
    // This way we can at least fetch the error messages someway instead of
    // lost them...
    var out_stderr = stdout && stdout.stderr
    if(out_stderr) out_stderr.pipe(stderr)
  }

  cp.on('error', result.emit.bind(result, 'error'))
  cp.on('exit' , result.emit.bind(result, 'exit' ))

  // No `stdout`, emit `end` event when child process exit
  if(!stdout) cp.once('exit', result.emit.bind(result, 'end'))

  return result
}


module.exports = spawnStream
