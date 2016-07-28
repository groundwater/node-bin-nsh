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

const handler =
{
  ownKeys: function()
  {
    return Object.keys(environment)
  },

  get: function(_, prop)
  {
    var value = environment[prop]

    if(value === undefined) value = process.env[prop]
    if(value == null) value = ''

    return value
  },

  set: function(_, prop, value)
  {
    if(value === undefined) return this.deleteProperty(_, prop)

    // Exported environment variable
    const env = process.env
    if(env[prop] !== undefined)
      env[prop] = value

    // Local environment variable
    else
      environment[prop] = value
  },

  deleteProperty: function(_, prop)
  {
    // Local environment variable
    var value = environment[prop]
    if(value !== undefined)
      delete environment[prop]

    // Exported environment variable
    else
      delete process.env[prop]
  }
}


exports = new Proxy({}, handler)


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


module.exports = exports
