var fs = require('fs')

var ast2js = require('./index')


function redirectFd(item, callback)
{
  function onError(error)
  {
    this.removeListener('open', onOpen)

    callback(error)
  }

  function onOpen()
  {
    this.removeListener('error', onError)

    callback(null, this)
  }


  ast2js(item.filename, function(error, filename)
  {
    if(error) return callback(error)

    var result

    var op = item.op
    switch(op)
    {
      case '<':
        result = fs.createReadStream(filename)
      break

      case '>':
      case '&>':
        result = fs.createWriteStream(filename, {flags: 'wx'})
      break

      case '>|':
        result = fs.createWriteStream(filename)
      break

      case '>>':
      case '&>>':
        result = fs.createWriteStream(filename, {flags: 'a'})
      break

      default:
        return callback('Unknown redirectFd op "'+op+'"')
    }

    result.once('error', onError)
    result.once('open' , onOpen)
  })
}


module.exports = redirectFd
