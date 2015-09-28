A simple yet powerful module to allow you to use ES6 tagged template strings for prepared/escaped statements in [mysql](https://www.npmjs.com/package/mysql) / [mysql2](https://www.npmjs.com/package/mysql2) and [postgres](https://www.npmjs.com/package/pq) (and with simple, I mean only 7 lines of code!).

Example for escaping queries (callbacks omitted):
```js
let SQL = require('sql-template-strings')

let book = 'harry potter'

// mysql (for mysql2 prepared statements, just replace query with execute):
mysql.query('SELECT author FROM books WHERE name = ?', [book])
// is equivalent to
mysql.query(SQL`SELECT author FROM books WHERE name = ${book}`)

// postgres:
pg.query('SELECT author FROM books WHERE name = $1', [book])
// is equivalent to
pg.query(SQL`SELECT author FROM books WHERE name = ${book}`)
```
This might not seem like a big deal, but when you do an INSERT with a lot columns writing all the placeholders becomes a nightmare:

```js
db.query(
  'INSERT INTO books (name, author, isbn, category, recommended_age, pages, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
  [name, author, isbn, category, recommendedAge, pages, price]
)
// is better written as
db.query(SQL`
  INSERT
  INTO    books
          (name, author, isbn, category, recommended_age, pages, price)
  VALUES  (${name}, ${author}, ${isbn}, ${category}, ${recommendedAge}, ${pages}, ${price})
`)
```
Also template strings support line breaks, while normal strings do not.

Please note that postgre requires prepared statements to be named, otherwise the parameters will be escaped and replaced on the client side.
You can still use SQL template strings though, you just need to assign a name to the query before using it:
```js
// old way
pg.query({name: 'my_query', text: 'SELECT author FROM books WHERE name = $1', values: [book]})

//with template strings
let query = SQL`SELECT author FROM books WHERE name = ${book}`
query.name = 'my_query'
pg.query(query)

// or using lodash
pg.query(_.assign(SQL`SELECT author FROM books WHERE name = ${book}`, {name: 'my_query'}))
```

# Contributing
 - Tests are written using [mocha](https://www.npmjs.com/package/mocha) (BDD style) and [chai](https://www.npmjs.com/package/chai) (expect style)
 - This module follows [standard](https://www.npmjs.com/package/standard) coding style
 - Since this module is only compatible with ES6 versions of node anyway, use all the ES6 goodies