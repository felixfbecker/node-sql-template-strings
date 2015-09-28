'use strict'
module.exports = function SQL (strings) {
  return {
    sql: strings.join('?'), // for mysql / mysql2
    text: strings.reduce((previous, current, i) => previous + '$' + i + current), // for postgres
    values: Array.from(arguments).slice(1) // since node doesnt support argument unpacking yet
  }
}
