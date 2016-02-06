var ast2js = require('./index')


function variable(item, callback)
{
  var name = item.name

  var value = global[name]

  if(value == null) value = process.env[name]
  if(value == null) value = ''

  callback(null, value)
}


module.exports = variable
