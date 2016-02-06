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

  execCommands({output: output}, item.commands, function(error)
  {
    if(error) return callback(error)

    callback(null, buffer.join(''))
  })
}


module.exports = commandSubstitution
