const SQL = require('../..')
const mysql = require('mysql')
const assert = require('assert')

describe('mysql', () => {
  for (const test of ['Connection', 'Pool']) {
    describe(test, () => {
      it('should work with a simple query', done => {
        const connection = mysql['create' + test](process.env.MYSQL_CONN)
        connection.query(SQL`SELECT ${1} + 1 AS result`, (err, rows) => {
          if (err) {
            return done(err)
          }
          assert.equal(rows[0].result, 2)
          done()
        })
      })
    })
  }
})
