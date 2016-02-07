function variable(item, callback)
{
  var name = item.name || item.expression

  var value = global[name]

  if(value == null) value = process.env[name]
  if(value == null) value = ''

  callback(null, value)
}


module.exports = variable
