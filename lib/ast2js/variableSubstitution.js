const environment = require('./_environment')


function variableSubstitution(item, callback)
{
  callback(null, environment.get(item.expression))
}


module.exports = variableSubstitution
