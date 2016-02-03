var tty = require('tty')

var ast2js = require('./ast2js')


var npmPath = require('npm-path').bind(null, {env:{PATH:process.env.PATH}})


function noop(){}


function execCommand(rl, command, callback)
{
  npmPath()

  ast2js(command, function(error, command)
  {
    if(error) return callback(error)

    if(command == null) return callback()

    if(command.writable)
    {
      var stdin = tty.ReadStream(rl.input.fd)

      rl.input.pause()

      stdin.pipe(command)
    }

    if(command.readable)
    {
      var stdout = tty.WriteStream(rl.output.fd)

      command.pipe(stdout)
    }

    command.on('end', function(code)
    {
      if(stdin)
      {
        stdin.end()  // This in needed to don'l loose chars, not sure why...
        stdin.unpipe(command)

        rl.input.resume()
      }

      if(stdout)
        command.unpipe(stdout)

      callback(code)
    })
    .on('error', function(error)
    {
      if(error.code !== 'ENOENT') throw error

      console.error(error.path+': not found')
    })
  })
}


module.exports = execCommand
