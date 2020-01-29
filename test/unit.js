'use strict'
let assert = require('assert')
let SQL = require('..')

describe('SQL', () => {
  it('should work with a simple query', () => {
    const query = SQL`SELECT * FROM table`
    assert.equal(query.sql, 'SELECT * FROM table')
    assert.equal(query.text, 'SELECT * FROM table')
    assert.equal(query.query, 'SELECT * FROM table')
    assert.deepEqual(query.values, [])
  })

  it('should work with a query with values', () => {
    const value = 1234
    const query = SQL`SELECT * FROM table WHERE column = ${value}`
    assert.equal(query.sql, 'SELECT * FROM table WHERE column = ?')
    assert.equal(query.query, 'SELECT * FROM table WHERE column = ?')
    assert.equal(query.text, 'SELECT * FROM table WHERE column = $1')
    assert.deepEqual(query.values, [value])
  })

  it('should work with falsy values', () => {
    const value1 = false
    const value2 = null
    const query = SQL`SELECT * FROM table WHERE column1 = ${value1} AND column2 = ${value2}`
    assert.equal(query.sql, 'SELECT * FROM table WHERE column1 = ? AND column2 = ?')
    assert.equal(query.query, 'SELECT * FROM table WHERE column1 = ? AND column2 = ?')
    assert.equal(query.text, 'SELECT * FROM table WHERE column1 = $1 AND column2 = $2')
    assert.deepEqual(query.values, [value1, value2])
  })

  it('should expose "sql" as an enumerable property', () => {
    const query = SQL`SELECT * FROM table`
    for (const key in query) {
      if (key === 'sql') {
        return
      }
    }
    throw new assert.AssertionError({ message: 'expected enumerable property "sql"' })
  })

  describe('append()', () => {
    it('should return this', () => {
      const query = SQL`SELECT * FROM table`
      assert.strictEqual(query, query.append('whatever'))
    })

    it('should append a second SQLStatement', () => {
      const value1 = 1234
      const value2 = 5678
      const query = SQL`SELECT * FROM table WHERE column = ${value1}`.append(SQL` AND other_column = ${value2}`)
      assert.equal(query.sql, 'SELECT * FROM table WHERE column = ? AND other_column = ?')
      assert.equal(query.text, 'SELECT * FROM table WHERE column = $1 AND other_column = $2')
      assert.deepEqual(query.values, [value1, value2])
    })

    it('should append a string', () => {
      const value = 1234
      const query = SQL`SELECT * FROM table WHERE column = ${value}`.append(' ORDER BY other_column')
      assert.equal(query.sql, 'SELECT * FROM table WHERE column = ? ORDER BY other_column')
      assert.equal(query.text, 'SELECT * FROM table WHERE column = $1 ORDER BY other_column')
      assert.deepEqual(query.values, [value])
    })

    it('should work with a bound statement', () => {
      const value = 1234
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind(true).append(' ORDER BY other_column')
      assert.equal(statement.sql, 'SELECT * FROM table WHERE column = ? ORDER BY other_column')
      assert.equal(statement.text, 'SELECT * FROM table WHERE column = $1 ORDER BY other_column')
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = $1 ORDER BY other_column')
      assert.strictEqual(statement.values, undefined)
      assert.strictEqual('values' in statement, false)
      assert.deepStrictEqual(statement.bind, [1234])
    })
  })

  describe('appendAll()', () => {
    it('should append multiple statements', () => {
      const value1 = 1234
      const value2 = '5678'
      const statement = SQL`SELECT * FROM table `
        .appendAll([
          SQL`WHERE col_1 = ${value1}`,
          SQL`AND col_2 = ${value2}`
        ])
      assert.equal(statement.sql, 'SELECT * FROM table WHERE col_1 = ? AND col_2 = ?')
      assert.equal(statement.text, 'SELECT * FROM table WHERE col_1 = $1 AND col_2 = $2')
      assert.deepEqual(statement.values, [value1, value2])
    })

    it('should work with strings', () => {
      const value1 = 1234
      const value2 = '5678'
      const statement = SQL`SELECT * `
        .appendAll([
          'FROM table',
          SQL`WHERE col_1 = ${value1}`,
          SQL`AND col_2 = ${value2}`
        ])
      assert.equal(statement.sql, 'SELECT * FROM table WHERE col_1 = ? AND col_2 = ?')
      assert.equal(statement.text, 'SELECT * FROM table WHERE col_1 = $1 AND col_2 = $2')
      assert.deepEqual(statement.values, [value1, value2])
    })

    it('should use a custom delimiter if passed in', () => {
      const value1 = 1234
      const value2 = '5678'
      const statement = SQL`SELECT * FROM table WHERE `
        .appendAll([SQL`col_1 = ${value1}`, SQL`col_2 = ${value2}`], ' AND ')
      assert.equal(statement.sql, 'SELECT * FROM table WHERE col_1 = ? AND col_2 = ?')
      assert.equal(statement.text, 'SELECT * FROM table WHERE col_1 = $1 AND col_2 = $2')
      assert.deepEqual(statement.values, [value1, value2])
    })

    it('should work with multiple inserts', () => {
      const rows = [{ col1: 'one', col2: 'two' }, { col1: 'three', col2: 'four' }]
      const statement = SQL`INSERT INTO table (column_1, column_2) VALUES `
        .appendAll(rows.map(c => SQL`(${c.col1}, ${c.col2})`), ', ')
      assert.equal(statement.sql, 'INSERT INTO table (column_1, column_2) VALUES (?, ?), (?, ?)')
      assert.equal(statement.text, 'INSERT INTO table (column_1, column_2) VALUES ($1, $2), ($3, $4)')
      assert.deepEqual(statement.values, ['one', 'two', 'three', 'four'])
    })
  })

  describe('setName()', () => {
    it('should set the name and return this', () => {
      assert.equal(SQL`SELECT * FROM table`.setName('my_query').name, 'my_query')
    })
  })

  describe('useBind()', () => {
    it('should change query to $n syntax and swap values with bind', () => {
      const value = 123
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind(true)
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = $1')
      assert.strictEqual(statement.values, undefined)
      assert.strictEqual('values' in statement, false)
      assert.deepStrictEqual(statement.bind, [123])
    })

    it('should allow to omit the parameter', () => {
      const value = 123
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind()
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = $1')
      assert.strictEqual(statement.values, undefined)
      assert.strictEqual('values' in statement, false)
      assert.deepStrictEqual(statement.bind, [123])
    })

    it('should be idempotent', () => {
      const value = 123
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind(true).useBind(true)
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = $1')
      assert.strictEqual(statement.values, undefined)
      assert.strictEqual('values' in statement, false)
      assert.deepStrictEqual(statement.bind, [123])
    })

    it('should be reversable', () => {
      const value = 123
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind(true).useBind(false)
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = ?')
      assert.strictEqual(statement.bind, undefined)
      assert.strictEqual('bind' in statement, false)
      assert.deepStrictEqual(statement.values, [123])
    })
  })
})
