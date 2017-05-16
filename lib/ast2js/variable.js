const environment = require('./_environment')


function variable(item, callback)
{
  callback(null, environment[item.name])
}


module.exports = variable
