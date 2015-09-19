A simple yet powerful module to allow you to use ES6 tagged template strings for prepared/escaped statements in mysql/mysql2 and postgres (and with simple, I mean only 7 lines of code!).

Examples (callbacks omitted):
```js
let SQL = require('sql-template-strings');

let book = 'harry potter';

mysql.query('SELECT author FROM books WHERE name = ?', [book]);
// is equivalent to
mysql.query(SQL`SELECT author FROM books WHERE name = ${book}`);

pg.query('SELECT author FROM books WHERE name = $1', [book]);
// is equivalent to
pg.query(SQL`SELECT author FROM books WHERE name = ${book}`);
```

This might not seem like a big deal, but when you do an INSERT with a lot columns writing all the placeholders becomes a nightmare:

```js
db.query('INSERT INTO books (name, author, isbn, category, recommended_age, pages, price) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, author, isbn, category, recommendedAge, pages, price])
// is equivalent to
db.query(SQL`
  INSERT
  INTO    books
          (name, author, isbn, category, recommended_age, pages, price)
  VALUES  (${name}, ${author}, ${isbn}, ${category}, ${recommendedAge}, ${pages}, ${price})
`)
```

Also template strings support line breaks.