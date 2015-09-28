'use strict'

function SQL (strings) {
  let args = Array.from(arguments).slice(1)
  let sql = '' // for mysql/mysql2
  let text = '' // for postgres
  let values = args
  for (let i = 0, length = strings.length; i < length; i++) {
    sql += strings[i]
    text += strings[i]
    if (i < length - 1) {
      sql += '?'
      text += '$' + (i + 1)
    }
  }
  return {sql, text, values}
}

module.exports = SQL
