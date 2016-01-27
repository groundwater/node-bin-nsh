var ast2js = require('./index')


function variableAssignment(item, callback)
{
  ast2js(item.name, function(error, key)
  {
    if(error) return callback(error)

    ast2js(item.value, function(error, value)
    {
      if(error) return callback(error)

      global[key] = value

      callback()
    })
  })
}


module.exports = variableAssignment
