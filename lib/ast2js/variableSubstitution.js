const environment = require('./_environment')


function variableSubstitution(item, callback)
{
  callback(null, environment[item.expression])
}


module.exports = variableSubstitution
