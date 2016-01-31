var ast2js = require('./index')


function pipe(item, callback)
{
  ast2js(item.command, callback)
}


module.exports = pipe
