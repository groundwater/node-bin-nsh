var ast2js = require('./index')


function variable(item, callback)
{
  ast2js(item.name, function(error, key)
  {
    if(error) return callback(error)

    callback(null, global[key])
  })
}


module.exports = variable
