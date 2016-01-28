var ast2js = require('./index')


function variableAssignment(item, callback)
{
  ast2js(item.value, function(error, value)
  {
    if(error) return callback(error)

    global[item.name] = value

    callback()
  })
}


module.exports = variableAssignment
