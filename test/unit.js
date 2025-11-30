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

  it('should work with a nested query', () => {
    const value1 = 1234
    const value2 = 5678
    const value3 = 9012
    const query1 = SQL`SELECT column2 FROM other_table WHERE column = ${value2} ORDER BY column2`
    const query2 = SQL`SELECT * FROM table WHERE column1 = ${value1} AND column2 IN (${query1}) AND column3 = ${value3}`
    query2.unnest()
    assert.equal(query2.sql, 'SELECT * FROM table WHERE column1 = ? AND column2 IN (SELECT column2 FROM other_table WHERE column = ? ORDER BY column2) AND column3 = ?')
    assert.equal(query2.query, 'SELECT * FROM table WHERE column1 = ? AND column2 IN (SELECT column2 FROM other_table WHERE column = ? ORDER BY column2) AND column3 = ?')
    assert.equal(query2.text, 'SELECT * FROM table WHERE column1 = $1 AND column2 IN (SELECT column2 FROM other_table WHERE column = $2 ORDER BY column2) AND column3 = $3')
    assert.deepEqual(query2.values, [value1, value2, value3])
  })

  it('should work with a deeply nested query', () => {
    const value1 = 1234
    const value2 = 5678
    const value3 = 9012
    const value4 = 3456
    const query1 = SQL`SELECT column2 FROM other_table1 WHERE column = ${value2} ORDER BY column2`
    const query2 = SQL`SELECT column2 FROM other_table2 WHERE column IN (${query1}) AND column3 = ${value3} ORDER BY column3`
    const query3 = SQL`SELECT * FROM table WHERE column1 = ${value1} AND column2 IN (${query2}) AND column4 = ${value4}`
    query3.unnest()
    assert.equal(query3.sql, 'SELECT * FROM table WHERE column1 = ? AND column2 IN (SELECT column2 FROM other_table2 WHERE column IN (SELECT column2 FROM other_table1 WHERE column = ? ORDER BY column2) AND column3 = ? ORDER BY column3) AND column4 = ?')
    assert.equal(query3.query, 'SELECT * FROM table WHERE column1 = ? AND column2 IN (SELECT column2 FROM other_table2 WHERE column IN (SELECT column2 FROM other_table1 WHERE column = ? ORDER BY column2) AND column3 = ? ORDER BY column3) AND column4 = ?')
    assert.equal(query3.text, 'SELECT * FROM table WHERE column1 = $1 AND column2 IN (SELECT column2 FROM other_table2 WHERE column IN (SELECT column2 FROM other_table1 WHERE column = $2 ORDER BY column2) AND column3 = $3 ORDER BY column3) AND column4 = $4')
    assert.deepEqual(query3.values, [value1, value2, value3, value4])
  })

  it('should work with a deeply nested query and partial unnest', () => {
    const value1 = 1234
    const value2 = 5678
    const value3 = 9012
    const value4 = 3456
    const query1 = SQL`SELECT column2 FROM other_table1 WHERE column = ${value2} ORDER BY column2`
    const query2 = SQL`SELECT column2 FROM other_table2 WHERE column IN (${query1}) AND column3 = ${value3} ORDER BY column3`
    const query3 = SQL`SELECT * FROM table WHERE column1 = ${value1} AND column2 IN (${query2}) AND column4 = ${value4}`
    query3.unnest(false)
    assert.equal(query3.sql, 'SELECT * FROM table WHERE column1 = ? AND column2 IN (SELECT column2 FROM other_table2 WHERE column IN (?) AND column3 = ? ORDER BY column3) AND column4 = ?')
    assert.equal(query3.query, 'SELECT * FROM table WHERE column1 = ? AND column2 IN (SELECT column2 FROM other_table2 WHERE column IN (?) AND column3 = ? ORDER BY column3) AND column4 = ?')
    assert.equal(query3.text, 'SELECT * FROM table WHERE column1 = $1 AND column2 IN (SELECT column2 FROM other_table2 WHERE column IN ($2) AND column3 = $3 ORDER BY column3) AND column4 = $4')
    assert.deepEqual(query3.values, [value1, query1, value3, value4])
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
