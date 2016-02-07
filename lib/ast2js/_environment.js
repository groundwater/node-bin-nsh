var environment = {}


exports.keys = function()
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
  var env = process.env

  // Exported environment variable
  if(env[key] !== undefined)
    env[key] = value

  // Local environment variable
  else
    environment[key] = value
}
