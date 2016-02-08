var Writable = require('stream').Writable

var environment  = require('./_environment')
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

  // Protect environment variables
  environment.push()

  execCommands({output: output}, item.commands, function(error)
  {
    // Restore environment variables
    environment.pop()

    // Restore (possible) changed current dir
    process.chdir(process.env.PWD)

    if(error) return callback(error)

    callback(null, buffer.join(''))
  })
}


module.exports = commandSubstitution
