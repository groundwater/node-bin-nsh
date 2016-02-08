var reduce = require('async').reduce

var ast2js = require('./index')


function getSrcFd(stdio, fd)
{
  var result = stdio[fd]

  if(typeof result === 'string') return fd

  return result
}


function iterator(stdio, redirect, callback)
{
  ast2js(redirect, function(error, value)
  {
    if(error) return callback(error)

    var type = redirect.type
    switch(type)
    {
      case 'duplicateFd':
        stdio[redirect.destFd] = getSrcFd(stdio, redirect.srcFd)
      break;

      case 'moveFd':
        stdio[redirect.dest] = getSrcFd(stdio, redirect.fd)
        stdio[redirect.fd]   = 'ignore'
      break;

      case 'pipe':
        stdio[1] = value
      break;

      case 'redirectFd':
        stdio[redirect.fd] = value

        if(redirect.op === '&>'
        || redirect.op === '&>>')
          stdio[2] = value
      break;

      default:
        return callback('Unknown redirect type "'+type+'"')
    }

    callback(null, stdio)
  })
}


function redirects(array, callback)
{
  reduce(array, ['pipe', 'pipe', 'pipe'], iterator, callback)
}


module.exports = redirects
