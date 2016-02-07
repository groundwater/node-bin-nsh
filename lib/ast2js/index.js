function noop(item, callback)
{
  callback()
}

function notImplemented(item, callback)
{
  var error = new Error("'"+item.type+"' not implemented")
      error.item = item
  throw error
}


function ast2js(item, callback)
{
  ast2js[item.type](item, callback)
}


module.exports = ast2js


var variable = require('./variable')

ast2js.command              = require('./command')
ast2js.commandSubstitution  = require('./commandSubstitution')
ast2js.duplicateFd          = noop  // Processed on `redirects` file
ast2js.glob                 = require('./glob')
ast2js.ifElse               = require('./ifElse')
ast2js.literal              = require('./literal')
ast2js.moveFd               = noop  // Processed on `redirects` file
ast2js.pipe                 = require('./pipe')
ast2js.processSubstitution  = notImplemented
ast2js.redirectFd           = require('./redirectFd')
ast2js['until-loop']        = require('./until-loop')
ast2js.variable             = variable
ast2js.variableAssignment   = require('./variableAssignment')
ast2js.variableSubstitution = variable
ast2js['while-loop']        = require('./while-loop')
