var during = require('async').during

var ast2js = require('./index')


function while_loop(item, callback)
{
  during(ast2js.bind(null, item.test),
         ast2js.bind(null, item.body),
         callback)
}


module.exports = while_loop
