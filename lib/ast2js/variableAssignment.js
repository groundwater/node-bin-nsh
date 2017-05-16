var ast2js      = require('./index')
var environment = require('./_environment')


function variableAssignment(item, callback)
{
  ast2js(item.value, function(error, value)
  {
    if(error) return callback(error)

    environment[item.name] = value

    callback()
  })
}


module.exports = variableAssignment
