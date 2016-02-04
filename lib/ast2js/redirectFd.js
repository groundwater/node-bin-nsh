var fs = require('fs')

var ast2js = require('./index')


function redirectFd(item, callback)
{
  ast2js(item.filename, function(error, filename)
  {
    if(error) return callback(error)

    var result

    var op = item.op
    switch(op)
    {
      case '<':
        result = fs.createReadStream(filename)
      break;

      case '>':
      case '&>':
        result = fs.createWriteStream(filename)
      break;

      case '>>':
      case '&>>':
        result = fs.createWriteStream(filename, {flags: 'a'})
      break;

      case '>|':
        return callback('redirectFd "'+op+'" op not implemented')

      default:
        return callback('Unknown redirectFd op "'+op+'"')
    }

    result.once('open', callback.bind(null, null, result))
  })
}


module.exports = redirectFd
