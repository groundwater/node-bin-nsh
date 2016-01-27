var async = require('async')

var ast2js = require('./index')


function ifElse(item, callback)
{
  ast2js(item.test, function(error, value)
  {
    if(error) return callback(error)

    if(value) return ast2js(item.body, callback)

    var elifBlocks = item.elifBlocks || []

    function runTests(item, callback2)
    {
      ast2js(item.test, function(error, result)
      {
        if(error) return callback(error)

        callback2(result)
      })
    }

    function execBody(block)
    {
      if(block) return ast2js(block.body, callback)

      if(item.elseBody) return ast2js(item.elseBody, callback)

      callback()
    }

    async.detectSeries(elifBlocks, runTests, execBody)
  })
}


module.exports = ifElse
