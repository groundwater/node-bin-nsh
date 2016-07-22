const environment = require('./_environment')


function variable(item, callback)
{
  callback(null, environment.get(item.name))
}


module.exports = variable
