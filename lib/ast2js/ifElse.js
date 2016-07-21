var detectSeries = require('async').detectSeries

var ast2js = require('./index')


function ifElse(item, callback)
{
  function runTest(item, callback2)
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


  runTest(item, function(value)
  {
    if(value) return ast2js(item.body, callback)

    detectSeries(item.elifBlocks || [], runTest, execBody)
  })
}


module.exports = ifElse
