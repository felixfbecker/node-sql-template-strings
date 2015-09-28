'use strict'

function SQL (strings) {
  let args = Array.from(arguments).slice(1)
  let sql = '' // for mysql/mysql2
  let text = '' // for postgres
  let values = []
  for (let i = 0, length = strings.length; i < length; i++) {
    sql += strings[i]
    text += strings[i]
    if (typeof args[i] === 'object' && args[i].raw) {
      sql += args[i].value
      text += args[i].value
    }
    else {
      if (args[i]) {
        values.push(args[i])
        if (i < length - 1) {
          sql += '?'
          text += '$' + values.length
        }
      }
    }
  }
  return {sql, text, values}
}

SQL.raw = function (value) {
  return {value, raw: true}
}

module.exports = SQL
