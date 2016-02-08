var environment =
{
  '?': 0,
  PS1: '\\w > ',
  PS2: '> ',
  PS4: '+ '
}


//
// Regular access
//

exports.ownKeys = function()
{
  return Object.keys(environment)
}

exports.get = function(key)
{
  var value = environment[key]

  if(value === undefined) value = process.env[key]
  if(value == null) value = ''

  return value
}

exports.set = function(key, value)
{
  if(value === undefined) return exports.del(key)

  var env = process.env

  // Exported environment variable
  if(env[key] !== undefined)
    env[key] = value

  // Local environment variable
  else
    environment[key] = value
}

exports.del = function(key)
{
  var value = environment[key]

  if(value !== undefined)
    delete environment[key]
  else
    delete process.env[key]
}


//
// Stacked environment variables
//

exports.push = function()
{
  process.env = {__proto__: process.env}
  environment = {__proto__: environment}
}

exports.pop = function()
{
  process.env = process.env.__proto__
  environment = environment.__proto__
}
