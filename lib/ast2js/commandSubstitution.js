var Writable = require('stream').Writable

var execCommands = require('./_execCommands')


function commandSubstitution(item, callback)
{
  var buffer = []

  var output = new Writable()
      output._write = function(chunk, _, done)
      {
        buffer.push(chunk)
        done()
      }

  // Backup cwd
  var env = process.env

  var pwd    = env.PWD
  var oldPwd = env.OLDPWD

  execCommands({output: output}, item.commands, function(error)
  {
    // Restore (possible) changed cwd
    process.chdir(pwd)
    env.PWD = pwd

    if(oldPwd)
      env.OLDPWD = oldPwd
    else
      delete env.OLDPWD

    if(error) return callback(error)

    callback(null, buffer.join(''))
  })
}


module.exports = commandSubstitution
