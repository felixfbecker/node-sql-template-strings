/* global describe, it */
'use strict'
let expect = require('chai').expect
let SQL = require('..')

describe('SQL', function () {
  it('should work with a simple query', function () {
    expect(SQL`SELECT * FROM table`).to.deep.equal({
      sql: 'SELECT * FROM table',
      text: 'SELECT * FROM table',
      values: []
    })
  })
  it('should work with a query with values', function () {
    let value = 1234
    expect(SQL`SELECT * FROM table WHERE column = ${value}`).to.deep.equal({
      sql: 'SELECT * FROM table WHERE column = ?',
      text: 'SELECT * FROM table WHERE column = $1',
      values: [value]
    })
  })
})
