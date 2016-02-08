var command = require('./command')


function pipe(item, callback)
{
  command(item.command, callback)
}


module.exports = pipe
