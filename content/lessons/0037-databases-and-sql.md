---
title: Databases and SQL
summary: Tables, queries, joins and aggregates, plus the parameterised queries that stop SQL injection.
month: 6
minutes: 65
builds: write joins and aggregates from memory
source: SQLBolt, interactive SQL lessons | https://sqlbolt.com/
words: SQL, join, parameterised query
---
SQL shows up three times in your career: in the apps you'll secure, in the databases you'll defend, and in SIEM queries that look a lot like it. Learn it once and you'll use it daily.

@term database = An organised store of data that many programs can query.
@term SQL = Structured Query Language: the language for querying relational databases.
@term table = A set of rows and columns in a relational database.
@term primary key = A column that uniquely identifies each row.
@term foreign key = A column that refers to a row in another table.
@term join = Combining rows from two tables on a related column.
@term aggregate = A calculation over many rows, like COUNT or SUM.
@term index = A database structure that makes lookups fast.
@term transaction = A group of database operations that succeed or fail together.
@term parameterised query = A query where values are sent separately from the SQL, so that they can't change its meaning.
@term ORM = Object-relational mapper: a library that writes SQL for your code.
@term SQL injection (SQLi) = Getting input interpreted as part of a SQL query.

## Tables

```
users                              orders
id | name  | role                  id | user_id | total
1  | ana   | admin                 10 | 1       | 40
2  | sam   | user                  11 | 2       | 15
3  | tom   | user                  12 | 2       | 70
```

`id` is each table's **primary key**. `orders.user_id` is a **foreign key**, pointing at a user.

Don't just read the tables: build them. SQLite is a complete SQL database in a single file, with nothing to configure, which makes it ideal for learning. On Ubuntu, install its command-line tool with `sudo apt install sqlite3`, then open a new database:

```
sqlite3 shop.db
```

You're now at a `sqlite>` prompt. Type these statements. Each one ends with a semicolon, and nothing runs until you type it:

```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER);

INSERT INTO users VALUES (1, 'ana', 'admin'), (2, 'sam', 'user'), (3, 'tom', 'user');
INSERT INTO orders VALUES (10, 1, 40), (11, 2, 15), (12, 2, 70);
```

`CREATE TABLE` names the columns and says what type of value each holds. `INSERT INTO` adds rows, one set of brackets per row. Four commands that start with a dot belong to the tool, not to SQL, and make it pleasant to use:

| Command | Does |
|---|---|
| `.tables` | Lists the tables |
| `.schema users` | Shows the statement that created a table |
| `.headers on` then `.mode column` | Prints results as a neat table with column names |
| `.quit` | Leaves |

Run `SELECT * FROM users;` and you should see the three rows above. Keep this window open for the rest of the lesson and try every query as you meet it.

### Why a database, and not a file?

You could keep users in a spreadsheet or a CSV file, and for one person that works. A database earns its place as soon as several programs use the data at once. It lets many readers and writers work at the same time without corrupting anything, it enforces rules on every row (this column is a number, this ID is unique), it answers questions in one language without you writing the search loop, and it can group changes so that they all happen or none do. That's why almost every application you'll assess keeps its data in one.

### SQLite, and the database servers

SQLite is a database in a single file, opened directly by the program that uses it: no server, no password, nothing listening on the network. The databases behind most websites work differently. **MySQL** (and its sibling MariaDB) and **PostgreSQL** run as servers, listening on ports 3306 and 5432, and programs connect to them over the network with a username and password:

```
mysql -h db.lab -u app -p shop
psql -h db.lab -U app shop
```

The SQL you type is almost the same everywhere; the differences are in the connection and in each product's extras. For a defender, the server model brings its own questions: who can reach that port, which account the application uses, and what that account is allowed to do. The Nmap lesson's "MySQL reachable from the staff network" finding is exactly this.

?? What's a foreign key?
+ A column pointing at another table
- A password from another country's server
- A key that encrypts the table
- A column that's always left empty
=> `orders.user_id` points at a row in `users`.

## The queries you need

```sql
SELECT name, role FROM users WHERE role = 'user';
SELECT * FROM orders WHERE total > 20 ORDER BY total DESC LIMIT 5;
```

Read a query as a sentence that starts in the middle. `FROM users` picks the table, `WHERE role = 'user'` keeps only the rows that pass the test, and `SELECT name, role` chooses which columns of those rows to show. In the second query, `*` means every column, `ORDER BY total DESC` sorts from the largest total down, and `LIMIT 5` stops after five rows.

Text values go in single quotes, and numbers don't. That small rule is where SQL injection lives, as you'll see below.

In an application, the value you search for comes from a user. The challenges in this lesson give you a small database, built by a `make_db()` function that you leave as it is, and ask you to query it from Python. `db.execute(sql, values)` runs a query and `.fetchall()` returns the rows as a list of tuples. Put a `?` in the SQL wherever a value goes, and pass the values separately.

@code users-with-role

### Joining tables

```sql
SELECT users.name, orders.total
FROM orders
JOIN users ON orders.user_id = users.id;
```

`JOIN` matches rows where the condition holds. `LEFT JOIN` keeps all rows from the left table, even with no match.

On the tables above, that join produces one line for each order, with the matching user's name attached:

| name | total |
|---|---|
| ana | 40 |
| sam | 15 |
| sam | 70 |

`tom` has no orders, so no row matches him and he vanishes from the result. Start from `users` and write `LEFT JOIN orders` if you want him kept: he then appears once, with an empty total. Forgetting this is the classic way a report quietly loses the accounts that did nothing, which are sometimes the ones you were looking for.

@code orders-with-names

### Aggregates

```sql
SELECT user_id, COUNT(*) AS orders, SUM(total) AS spent
FROM orders
GROUP BY user_id
HAVING SUM(total) > 50;
```

`WHERE` filters rows before grouping, and `HAVING` filters groups after. This is the same thinking as your `sort | uniq -c` pipeline, and SIEM languages work the same way.

The clauses are written in one order and carried out in another. Knowing the real order removes most confusion:

| Step | Clause | What happens |
|---|---|---|
| 1 | `FROM` and `JOIN` | Gather the rows |
| 2 | `WHERE` | Drop the rows that fail the test |
| 3 | `GROUP BY` | Put the remaining rows into groups |
| 4 | `HAVING` | Drop the groups that fail the test |
| 5 | `SELECT` | Compute the columns to show |
| 6 | `ORDER BY`, then `LIMIT` | Sort, then cut |

On the example, step 3 makes two groups: user 1 with one order of 40, and user 2 with two orders adding up to 85. Step 4 keeps only user 2, because 40 isn't more than 50.

@code big-spenders

### NULL, the value that isn't there

A missing value in SQL is `NULL`, which means "unknown", not zero or an empty string, and it behaves oddly. Give `tom` no role and ask:

```sql
SELECT name FROM users WHERE role = NULL;      -- returns nothing at all
SELECT name FROM users WHERE role IS NULL;     -- tom
SELECT name, role FROM users WHERE role != 'admin';
```

```
name  role
----  ----
sam   user
```

Any comparison with `NULL` is neither true nor false but unknown, and `WHERE` keeps only rows where the test is true. So `= NULL` never matches, `IS NULL` is the way to ask, and the last query quietly leaves `tom` out: he isn't an admin, but "unknown is not admin" isn't true either. Access checks written like that can miss accounts.

### When SQLite complains

These are real messages from `sqlite3`, and each says where to look:

| You see | It means |
|---|---|
| `no such table: user` | The table name is wrong; `.tables` lists the real ones |
| `no such column: nmae` | A column name is misspelt; `.schema users` shows them |
| `near "SELEC": syntax error` | SQLite stopped at the word it couldn't parse; the mistake is there or just before |
| `UNIQUE constraint failed: users.id` | That primary key already exists, so the row was refused |
| The prompt changes to `...>` | You haven't typed the closing `;` yet, so SQLite is waiting for more |

The newer `sqlite3` versions even point at the exact spot with `^--- error here` under the line.

?? You want each IP's failure count, only for IPs with more than 10. Which clause filters on the count?
+ `HAVING`, because it filters after any grouping
- `WHERE`, because it filters after any grouping
- `ORDER BY`, because it removes small rows
- `JOIN`, because it matches rows by count
=> `WHERE` runs on individual rows, before the count exists. `HAVING` runs on the groups.

## Indexes and transactions

An **index** is like a book's index: it makes lookups fast. Without one, the database scans the whole table.

A **transaction** groups changes so that they all happen or none do: move money from A to B, and never lose it halfway.

### Changing data, safely

`UPDATE` and `DELETE` change rows, and the `WHERE` clause decides which. Leave it out and the change hits every row. Try it inside a transaction, which you can take back:

```sql
BEGIN;
UPDATE users SET role = 'admin';
SELECT name, role FROM users;
ROLLBACK;
```

```
name  role
----  -----
ana   admin
sam   admin
tom   admin
```

Everyone became an admin, because the `WHERE id = 2` was forgotten. `ROLLBACK` cancels the whole transaction, and a `SELECT` afterwards shows the original roles again; `COMMIT` would have made the change permanent. Real database work follows the same habit: run the `SELECT` with the same `WHERE` first, check that it returns only the rows you mean, then turn it into the `UPDATE`.

?? What does a transaction guarantee?
+ All the changes happen, or none
- Changes happen faster than without one
- Data is encrypted on the disk
- Queries never need an index again
=> Money can't vanish halfway through a transfer.

## Parameterised queries: the most important thing here

This is the code that creates SQL injection:

```python
# WRONG: the input becomes part of the SQL
query = f"SELECT * FROM users WHERE name = '{name}' AND pw = '{pw}'"
```

If `name` is `' OR 1=1 --`, the query becomes:

```sql
SELECT * FROM users WHERE name = '' OR 1=1 --' AND pw = ''
```

`OR 1=1` is always true, and `--` comments out the rest. The attacker logs in without a password.

The fix is a **parameterised query**: the SQL and the values travel separately, so input can never become code.

```python
# RIGHT: the database treats name as data, whatever it contains
cur.execute("SELECT * FROM users WHERE name = %s", (name,))
```

Watch the difference on your own database. Python's `sqlite3` module uses `?` as its placeholder, where the PostgreSQL driver above uses `%s`:

```python
import sqlite3
db = sqlite3.connect("shop.db")

name = "' OR 1=1 --"
print(db.execute(f"SELECT name FROM users WHERE name = '{name}'").fetchall())
print(db.execute("SELECT name FROM users WHERE name = ?", (name,)).fetchall())
```

The first line prints all three users: the input rewrote the question. The second prints an empty list: the database looked for a user whose name is literally `' OR 1=1 --`, and nobody is called that. Same input, same database, and the only change is that the value travelled separately.

Parameters are the fix, and two more layers limit the damage if one query is missed. The application should connect with a database account that can only do what the application needs, so that an injected query can't drop tables or read other databases. And errors shown to users should say "something went wrong", not print the failed SQL.

You'll also meet injection from the defender's side, in web logs. Attempts arrive percent-encoded, so decode before you read:

```
GET /item?id=7%27%20OR%201%3D1-- HTTP/1.1
```

`%27` is a single quote, `%20` a space and `%3D` an equals sign, so the parameter is `7' OR 1=1--`. Somebody is checking whether `id` is pasted into a query.

::: key
The root cause of injection is **mixing code and data in one string**. You'll see the same mistake with HTML (XSS), shell commands and even LLM prompts. Fix the mixing and you fix the class.
:::

An **ORM** uses parameters for you, unless you build raw queries with string formatting. See the [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

?? Why do parameterised queries stop injection where escaping quotes can fail?
+ Values never get parsed as SQL code
- They encrypt each value before it's sent
- They reject any input containing a quote
- They run under a restricted database account
=> The query's structure is fixed first, and the values are bound afterwards. Input containing quotes stays plain data.

::: try Practise
Finish [SQLBolt](https://sqlbolt.com/), all lessons. Then install PostgreSQL in your VM and recreate the tables above with `psql`. Write the queries from memory: that's on your Month 6 gate.
:::

## Predict, then run

For each question, work out the answer on paper from the two tables at the top of the lesson. Then run the query in your `sqlite>` window and compare.

```sql
SELECT name FROM users WHERE role = 'user' ORDER BY name LIMIT 1;
```

?? What does that query return?
+ `sam`
- `tom`
- `ana`
- `user`
=> Two rows pass the `WHERE`: sam and tom. Sorted by name, sam comes first, and `LIMIT 1` keeps only him.

```sql
SELECT users.name, orders.total FROM users LEFT JOIN orders ON orders.user_id = users.id;
```

?? How many rows does that query return?
+ `4`
- `3`
- `2`
- `6`
=> One for ana's order, two for sam's, and one for tom with an empty total, because `LEFT JOIN` keeps every user.

?? A web log shows `GET /item?id=7%27%20OR%201%3D1--`. What is the sender doing?
+ Testing whether the parameter reaches SQL
- Asking for item seven in French
- Sending a normal, slightly long request
- Checking whether the site uses HTTPS
=> Decoded, the value is `7' OR 1=1--`: a quote to end the text, a condition that is always true, and a comment to discard the rest. It only works where input is pasted into the SQL.

?! In your own words, what's the root cause of SQL injection, and why does the same idea apply to XSS?
