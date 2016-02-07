var environment = require('./_environment')


function variable(item, callback)
{
  callback(null, environment.get(item.name || item.expression))
}


module.exports = variable
