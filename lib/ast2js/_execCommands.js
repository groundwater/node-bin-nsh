var tty      = require('tty')
var Writable = require('stream').Writable

var eachSeries = require('async').eachSeries


module.exports = execCommands

var ast2js      = require('./index')
var environment = require('./_environment')


// Always calculate dynamic `$PATH` based on the original one
var npmPath = require('npm-path').bind(null, {env:{PATH:process.env.PATH}})


function noop(){}


var input

function execCommands(rl, commands, callback)
{
  input = rl.input || input

  eachSeries(commands, function(command, callback)
  {
    // `$PATH` is dynamic based on current directory and any command could
    // change it, so we update it previously to exec any of them
    npmPath()

    command.output = rl.output

    ast2js(command, function(error, command)
    {
      if(error) return callback(error)

      if(command == null) return callback()

      if(command.writable)
      {
        var stdin = tty.ReadStream(input.fd)

        input.pause()
        stdin.pipe(command)
      }

      var command_stderr = command.stderr
      if(command_stderr)
      {
        var stderr = tty.WriteStream(process.stderr.fd)

        command_stderr.pipe(stderr)
      }

      command.once('end', function()
      {
        if(stdin)
        {
          stdin.end()  // Flush buffered data so we don'l loose any character
          stdin.unpipe(this)

          input.resume()
        }
        if(stderr) command_stderr.unpipe(stderr)

        callback()
      })
      .on('error', function(error)
      {
        if(error.code !== 'ENOENT') throw error

        console.error(error.path+': not found')
      })
      .on('exit', function(code, signal)
      {
        environment.set('?' , code)
        environment.set('??', signal)
      })
    })
  },
  callback)
}
