const EventEmitter = require('events')
const spawn        = require('child_process').spawn
const stream       = require('stream')

const Duplex   = stream.Duplex
const Readable = stream.Readable
const Writable = stream.Writable


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
  if(typeof stdin === 'string' || typeof stdin === 'number'
  || stdin && stdin.constructor.name === 'ReadStream')
    stdin = null
  else
    stdio[0] = 'pipe'

  if(typeof stdout === 'string' || typeof stdout === 'number'
  || stdout && stdout.constructor.name === 'WriteStream')
    stdout = null
  else
    stdio[1] = 'pipe'

  if(typeof stderr === 'string' || typeof stderr === 'number'
  || stderr && stderr.constructor.name === 'WriteStream')
    stderr = null
  else
    stdio[2] = 'pipe'

  // Create child process
  var cp = spawn(command, argv, options)

  // Adjust events, pipe streams and restore stdio
  if(stdin != null)
  {
    stdin.pipe(cp.stdin)
    cp.stdin = null
  }
  if(stdout != null)
  {
    cp.stdout.pipe(stdout)
    cp.stdout = null
  }
  if(stderr != null)
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

  var cp = wrapStdio(command, argv, options)

  stdin  = (stdin  == null || stdin  === 'pipe') ? cp.stdin  : null
  stdout = (stdout == null || stdout === 'pipe') ? cp.stdout : null
  stderr = (stderr == null || stderr === 'pipe') ? cp.stderr : null

  var result

  // Both `stdin` and `stdout` are open, probably the normal case. Create a
  // `Duplex` object with them so command can be used as a filter
  if(stdin && stdout) result = Duplex()

  // Only `stdout` is open, use it directly
  else if(stdout) result = Readable()

  // Only `stdin` is open, ensure is always 'only' `Writable`
  else if(stdin) result = Writable()

  // Both `stdin` and `stdout` are clossed, or already redirected on `spawn`
  else result = new EventEmitter()

  // Connect stdio streams
  if(stdin)
  {
    result._write = stdin.write.bind(stdin)
    result.once('finish', stdin.end.bind(stdin))
  }

  if(stdout)
  {
    result._read = noop
    stdout.on  ('data', result.push.bind(result))
    stdout.once('end' , result.push.bind(result, null))
  }

  // Use child process `exit` event instead of missing `stdout` `end` event
  else
    cp.once('exit', result.emit.bind(result, 'end'))

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

  // Propagate process events
  cp.once('error', result.emit.bind(result, 'error'))
  cp.once('exit' , result.emit.bind(result, 'exit' ))

  return result
}


module.exports = spawnStream
