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

  // Backup cwd
  var env = process.env

  var pwd    = env.PWD
  var oldPwd = env.OLDPWD

  eachSeries(commands, function(command, callback)
  {
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

      command.on('end', function(code)
      {
        if(stdin)
        {
          stdin.end()  // This in needed to don'l loose chars, not sure why...
          stdin.unpipe(this)

          input.resume()
        }
        if(stdout) this          .unpipe(stdout)
        if(stderr) command_stderr.unpipe(stderr)

        callback(code)
      })
      .on('error', function(error)
      {
        if(error.code !== 'ENOENT') throw error

        console.error(error.path+': not found')
      })
    })
  },
  function(error)
  {
    // Restore (possible) changed cwd
    process.chdir(pwd)
    env.PWD = pwd

    if(oldPwd)
      env.OLDPWD = oldPwd
    else
      delete env.OLDPWD

    callback(error)
  })
}
