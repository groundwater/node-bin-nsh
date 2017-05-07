var reduce = require('async').reduce

var ast2js = require('./index')


function filterPipes(item)
{
  return item.type === 'pipe'
}

function getSrcFd(stdio, fd)
{
  var result = stdio[fd]

  if(typeof result === 'string') return fd

  return result
}

function setOutput(item)
{
  item.command.output = this
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


function redirects(stdio, array, callback)
{
  array.filter(filterPipes).forEach(setOutput, stdio.stdout)

  reduce(array, stdio.slice(), iterator, callback)
}


module.exports = redirects
