var ast2js = require('./index')


function variableAssignment(item, callback)
{
  ast2js(item.value, function(error, value)
  {
    if(error) return callback(error)

    var name = item.name

    // Exported environment variable
    var env = process.env
    if(env[name] !== undefined)
      env[name] = value

    // Local environment variable
    else
      global[name] = value

    callback()
  })
}


module.exports = variableAssignment
