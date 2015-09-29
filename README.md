A simple yet powerful module to allow you to use ES6 tagged template strings for prepared/escaped statements in [mysql](https://www.npmjs.com/package/mysql) / [mysql2](https://www.npmjs.com/package/mysql2) and [postgres](https://www.npmjs.com/package/pq).

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

## Adding raw values
Some values cannot be replaced by placeholders in prepared statements, like table names. In these cases, you need to use `SQL.raw()` so the values get inserted directly. Please note that you are then responsible for escaping these values with proper escaping functions first if they come from user input. Also, executing many prepared statements with changing raw values in a loop will quickly overflow the prepared statement buffer (and destroy their performance benefit), so be careful. Examples:
```js
let table = 'books'
let order = 'DESC'
let column = 'author'

db.query(SQL`SELECT * FROM ${SQL.raw(table)} WHERE author = ${author} ORDER BY ${column} ${SQL.raw(order)}`)

// you MUST escape user input manually
mysql.query(SQL`SELECT * FROM ${SQL.raw(mysql.escapeId(someUserInput))} WHERE name = ${book} ORDER BY ${column} ${SQL.raw(order)}`)

// you might need to add quotes
pg.query(SQL`SELECT * FROM "${SQL.raw(table)}"`)
mysql.query(SQL`SELECT * FROM \`${SQL.raw(table)}\``)

// DONT DO THIS - THIS WILL OVERFLOW YOUR PREPARED STATEMENT BUFFER
for (let table of largeArray) {
  // for every iteration, a new query will be prepared, even though it is only executed once.
  // use mysql.query() instead.
  mysql2.execute(SQL`SELECT * FROM ${SQL.raw(table)}`)
}
```

## Prepared Statements in Postgres
Postgre requires prepared statements to be named, otherwise the parameters will be escaped and replaced on the client side.
You can still use SQL template strings though, you just need to assign a name to the query before using it:
```js
// old way
pg.query({name: 'my_query', text: 'SELECT author FROM books WHERE name = $1', values: [book]})

// with template strings
let query = SQL`SELECT author FROM books WHERE name = ${book}`
query.name = 'my_query'
pg.query(query)

// or using lodash
pg.query(_.assign(SQL`SELECT author FROM books WHERE name = ${book}`, {name: 'my_query'}))
```

## Postgres Keyword
You can enforce that a value is a Postgres keyword. If it fails, an exception `SQL.InvalidValue` is thrown.

```js
let order = 'desc'
pg.query(SQL`SELECT author FROM books ORDER BY author ${PG.keyword(order)}`)
// SELECT author FROM books ORDER BY author DESC
```

You can narrow your options farther with a second `limiter` argument.
```js
let order = 'TABLE_NAME'
pg.query(SQL`SELECT author FROM books ORDER BY author ${PG.keyword(order, ['DESC', 'ASC')}`)
// throws an error, although TABLE_NAME is a Postgresql keyword.
```

## Postgres Identifier
Postgres identifiers can only be made of alphanumeric, diacritical marked letters, numbers, underscores, and dollar signs.
`SQL.PG.identifier` will properly quote your identifier and ensure that it only contains valid characters.

```js
let field = 'author'
pg.query(SQL`SELECT ${PG.identifier(field)} FROM books`
// SELECT "author" FROM books
```

```js
let field = 'cheese sandwich'
pg.query(SQL`SELECT ${PG.identifier(field)} FROM books`
// throws SQL.InvalidValue because there is a space
```

You can also limit the possible values.
```js
let field = 'phone'
pg.query(SQL`SELECT ${PG.identifier(field, ['author', 'id')} FROM books`
// throws SQL.InvalidValue phone isn't one of the valid values
```

## Contributing
 - Tests are written using [mocha](https://www.npmjs.com/package/mocha) (BDD style) and [chai](https://www.npmjs.com/package/chai) (expect style)
 - This module follows [standard](https://www.npmjs.com/package/standard) coding style
 - You can use `npm test` to run the tests and check coding style
 - Since this module is only compatible with ES6 versions of node anyway, use all the ES6 goodies
 - Pull requests are welcome :)
