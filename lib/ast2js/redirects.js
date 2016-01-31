var eachSeries = require('async').eachSeries

var ast2js = require('./index')


function redirects(array, callback)
{
  var stdio = ['pipe', 'pipe', 'pipe']

  eachSeries(array, function(redirect, callback)
  {
    ast2js(redirect, function(error, value)
    {
      if(error) return callback(error)

      var type = redirect.type
      switch(type)
      {
        case 'duplicateFd':
          stdio[redirect.destFd] = stdio[redirect.srcFd]
        break;

        case 'moveFd':
          stdio[redirect.dest] = stdio[redirect.fd]
          stdio[redirect.fd]   = 'ignore'
        break;

        case 'pipe':
          stdio[1] = value
        break;

        case 'redirectFd':
          stdio[redirect.fd] = value
        break;

        default:
          return callback('Unknown redirect type "'+type+'"')
      }

      callback()
    })
  },
  function(error)
  {
    if(error) return callback(error)

    callback(null, stdio)
  })
}


module.exports = redirects
