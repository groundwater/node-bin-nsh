var ast2js = require('./index')


function variable(item, callback)
{
  var name = item.name

  callback(null, global[name] || process.env[name])
}


module.exports = variable
