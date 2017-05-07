const eachSeries = require('async/eachSeries')


module.exports = execCommands

const ast2js      = require('./index')
const environment = require('./_environment')


// Always calculate dynamic `$PATH` based on the original one
const npmPath = require('npm-path').bind(null, {env:{PATH:process.env.PATH}})


function execCommands(stdio, commands, callback)
{
  eachSeries(commands, function(command, callback)
  {
    // `$PATH` is dynamic based on current directory and any command could
    // change it, so we update it previously to exec any of them
    npmPath()

    command.stdio = stdio

    ast2js(command, function(error, command)
    {
      if(error) return callback(error)

      if(command == null) return callback()

      command.once('error', callback)
      .once('exit', function(code, signal)
      {
        environment['?']  = code
        environment['??'] = signal

        this.removeListener('error', callback)

        callback(code || signal)
      })
    })
  },
  callback)
}
