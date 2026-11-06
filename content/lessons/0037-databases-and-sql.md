---
title: Databases and SQL
summary: Tables, queries, joins and aggregates, plus the parameterised queries that stop SQL injection.
month: 6
minutes: 40
builds: write joins and aggregates from memory
source: SQLBolt, interactive SQL lessons | https://sqlbolt.com/
words: SQL, join, parameterised query
---
SQL shows up three times in your career: in the apps you'll attack, in the databases you'll defend, and in SIEM queries that look a lot like it. Learn it once and you'll use it daily.

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

### Joining tables

```sql
SELECT users.name, orders.total
FROM orders
JOIN users ON orders.user_id = users.id;
```

`JOIN` matches rows where the condition holds. `LEFT JOIN` keeps all rows from the left table, even with no match.

### Aggregates

```sql
SELECT user_id, COUNT(*) AS orders, SUM(total) AS spent
FROM orders
GROUP BY user_id
HAVING SUM(total) > 50;
```

`WHERE` filters rows before grouping, and `HAVING` filters groups after. This is the same thinking as your `sort | uniq -c` pipeline, and SIEM languages work the same way.

?? You want each IP's failure count, only for IPs with more than 10. Which clause filters on the count?
+ `HAVING`, because it filters after any grouping
- `WHERE`, because it filters after any grouping
- `ORDER BY`, because it removes small rows
- `JOIN`, because it matches rows by count
=> `WHERE` runs on individual rows, before the count exists. `HAVING` runs on the groups.

## Indexes and transactions

An **index** is like a book's index: it makes lookups fast. Without one, the database scans the whole table.

A **transaction** groups changes so that they all happen or none do: move money from A to B, and never lose it halfway.

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

?! In your own words, what's the root cause of SQL injection, and why does the same idea apply to XSS?
