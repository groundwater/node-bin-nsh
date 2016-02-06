var tty      = require('tty')
var Writable = require('stream').Writable

var eachSeries = require('async').eachSeries


module.exports = execCommands

var ast2js = require('./index')


var npmPath = require('npm-path').bind(null, {env:{PATH:process.env.PATH}})


function noop(){}


var input

function execCommands(rl, commands, callback)
{
  input = rl.input || input

  var output = rl.output

  eachSeries(commands, function(command, callback)
  {
    // `$PATH` is dynamic based on current directory and any command could
    // change it, so we update it previously to exec any of them
    npmPath()

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

      if(command.readable)
      {
        var fd = output.fd
        if(fd != null)
          var stdout = tty.WriteStream(fd)
        else
        {
          var stdout = new Writable()
              stdout._write = output._write.bind(output)
        }

        command.pipe(stdout)
      }

      var command_stderr = command.stderr
      if(command_stderr)
      {
        var stderr = tty.WriteStream(process.stderr.fd)

        command_stderr.pipe(stderr)
      }

      command.on('end', function()
      {
        if(stdin)
        {
          stdin.end()  // This in needed to don'l loose chars, not sure why...
          stdin.unpipe(this)

          input.resume()
        }
        if(stdout) this          .unpipe(stdout)
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
        global['?' ] = code
        global['??'] = signal
      })
    })
  },
  callback)
}
