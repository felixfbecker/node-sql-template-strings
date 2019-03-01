'use strict'

const lsp = str => (/^[\s\n\r]/.test(str) ? str : ' ' + str)
const push = (str, val, statement, spaced) => {
  const { strings } = statement
  str[str.length - 1] += spaced ? lsp(strings[0]) : strings[0]
  str.push(...strings.slice(1))
  val.push(...(statement.values || statement.bind))
}

class SQLStatement {
  /**
   * @param {string[]} strings
   * @param {any[]} values
   */
  constructor(strings, values) {
    this.strings = strings
    this.values = values
  }

  /** Returns the SQL Statement for Sequelize */
  get query() {
    return this.bind ? this.text : this.sql
  }

  /** Returns the SQL Statement for node-postgres */
  get text() {
    return this.strings.reduce((prev, curr, i) => prev + '$' + i + curr)
  }

  /**
   * @param {SQLStatement|string} statement
   * @returns {this}
   */
  append(statement) {
    const { strings } = this
    if (statement instanceof SQLStatement) {
      push(strings, this.values || this.bind, statement, true)
    } else {
      strings[strings.length - 1] += lsp(statement)
    }
    return this
  }

  /**
   * Use a prepared statement with Sequelize.
   * Makes `query` return a query with `$n` syntax instead of `?`
   * and switches the `values` key name to `bind`
   * @param {boolean} [value=true] value If omitted, defaults to `true`
   * @returns this
   */
  useBind(value) {
    if (value === undefined) {
      value = true
    }
    if (value && !this.bind) {
      this.bind = this.values
      delete this.values
    } else if (!value && this.bind) {
      this.values = this.bind
      delete this.bind
    }
    return this
  }

  /**
   * @param {string} name
   * @returns {this}
   */
  setName(name) {
    this.name = name
    return this
  }
}

/** Returns the SQL Statement for mysql */
Object.defineProperty(SQLStatement.prototype, 'sql', {
  enumerable: true,
  get() {
    return this.strings.join('?')
  },
})

class SQLQuote {
  /**
   * @param {string} quote
   */
  constructor(quote) {
    this.char = quote
    this.escape = new RegExp(quote, 'g')
  }
}

/**
 * @param {string[]} strings
 * @param {...any} values
 * @returns {SQLStatement}
 */
function SQL(tpl, ...val) {
  const strings = [tpl[0]]
  const values = []
  for (let { length } = tpl, prev = tpl[0], j = 0, i = 1; i < length; i++) {
    const current = tpl[i]
    const value = val[i - 1]
    if (/^('|")/.test(current) && RegExp.$1 === prev.slice(-1)) {
      if (this instanceof SQLQuote) {
        strings[j] = [strings[j].slice(0, -1), String(value).replace(this.escape, '\\$&'), current.slice(1)].join(
          this.char
        )
      } else {
        throw new Error(`Unable to escape ${value}. See SQL.withQuotes(...)`)
      }
    } else {
      if (value instanceof SQLStatement) {
        push(strings, values, value, false)
        j = strings.length - 1
        strings[j] += current
      } else {
        values.push(value)
        j = strings.push(current) - 1
      }
      prev = strings[j]
    }
  }
  return new SQLStatement(strings, values)
}

/**
 * @param {string} quote
 * @returns {SQL}
 */
SQL.withQuotes = quote => {
  const sqlQuote = new SQLQuote(quote)
  return (...args) => SQL.apply(sqlQuote, args)
}

SQL.SQL = SQL
SQL.default = SQL
SQL.SQLStatement = SQLStatement
module.exports = SQL
