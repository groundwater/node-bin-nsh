var ast2js = require('./index')


function pipe(item, callback)
{
  ast2js(item.command, function(error, value)
  {
    if(error) return callback(error)

    value.fd = 1

    callback(null, value)
  })
}


module.exports = pipe
