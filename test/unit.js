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

  it('should work with nested queries', () => {
    const query1 = SQL`SELECT * FROM table WHERE column1 = ${1}`
    const query2 = SQL`SELECT * FROM (${query1}) query1 WHERE column2 = ${2}`
    assert.equal(query2.sql, 'SELECT * FROM (SELECT * FROM table WHERE column1 = ?) query1 WHERE column2 = ?')
    assert.equal(query2.text, 'SELECT * FROM (SELECT * FROM table WHERE column1 = $1) query1 WHERE column2 = $2')
    assert.deepEqual(query2.values, [1, 2])
  })

  it('should work with parameterless nested queries', () => {
    const query1 = SQL`tableName`
    const query2 = SQL`SELECT * FROM ${query1}`
    assert.equal(query2.sql, 'SELECT * FROM tableName')
    assert.equal(query2.text, 'SELECT * FROM tableName')
  })

  it('should work with multiple nested queries', () => {
    let query1 = SQL`b=${2}, c=${3}`
    let query2 = SQL`d=${4}, e=${5}`
    let query3 = SQL`foo`
    let query = SQL`a=${1}, ${query1}, ${query3}, ${query2}, f=${6}`
    assert.equal(query.sql, 'a=?, b=?, c=?, foo, d=?, e=?, f=?')
    assert.equal(query.text, 'a=$1, b=$2, c=$3, foo, d=$4, e=$5, f=$6')
    assert.deepEqual(query.values, [1, 2, 3, 4, 5, 6])
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
