var EventEmitter = require('events')
var spawn        = require('child_process').spawn
var Duplex       = require('stream').Duplex


function noop(){}

/**
 * Node.js v0.12 don't accept as stdio streams without a file descriptor, so I
 * use the original `spawn()` ones and pipe them to the desired ones
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
  if(stdin && stdin.constructor.name === 'ReadStream')
    stdin = null
  else
    stdio[0] = 'pipe'

  if(stdout && stdout.constructor.name === 'WriteStream')
    stdout = null
  else
    stdio[1] = 'pipe'

  if(stderr && stderr.constructor.name === 'WriteStream')
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

  var cp = wrapStdio(command, argv, options)

  // `child_process` define `stdin` also when one is set. Is it a Node.js bug?
  if(stdin  && stdin .constructor.name === 'ReadStream' ) cp.stdin  = null
  if(stdout && stdout.constructor.name === 'WriteStream') cp.stdout = null
  if(stderr && stderr.constructor.name === 'WriteStream') cp.stderr = null

  stdin  = cp.stdin
  stdout = cp.stdout
  stderr = cp.stderr

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

  // Only one of `stdin` or `stdout` are open, use it directly.
  else if(stdin)  result = stdin
  else if(stdout) result = stdout

  // Both `stdin` and `stdout` are clossed.
  // This could never happen, but who knows...
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
