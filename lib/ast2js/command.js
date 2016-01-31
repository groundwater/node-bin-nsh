var map = require('async').map

var ast2js      = require('./index')
var redirects   = require('./redirects')
var spawnStream = require('./spawnStream')


function command(item, callback)
{
  // Command
  ast2js(item.command, function(error, command)
  {
    if(error) return callback(error)

    // Arguments
    map(item.args, ast2js, function(error, argv)
    {
      if(error) return callback(error)

      // Redirects
      redirects(item.redirects, function(error, stdio)
      {
        if(error) return callback(error)

        // Create command
        var env = item.env
        env.__proto__ = process.env

        var options =
        {
          env:   env,
          stdio: stdio
        }

        callback(null, spawnStream(command, argv, options))
      })
    })
  })
}


module.exports = command
