var ast2js = require('./index')


function variableSubstitution(item, callback)
{
  var value = item.expression

  callback(null, global[value] || process.env[value])
}


module.exports = variableSubstitution
