var during = require('async').during

var ast2js = require('./index')


function until_loop(item, callback)
{
  function test(callback)
  {
    ast2js(item.test, function(error, value)
    {
      callback(error, !value)
    })
  }

  during(test,
         ast2js.bind(null, item.body),
         callback)
}


module.exports = until_loop
