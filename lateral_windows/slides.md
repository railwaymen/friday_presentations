### Lateral Windows

Michał Szmyd

---

## Scenario

#### I have created a simple blog
Users can create posts with different categories
Users can leave comments

---

### Case
#### I would like to display top users activity in different categories
To make it more simplify i only take care of number of comments belonged to user per tag

---

### Just group it!

```sql
SELECT
  users.email,
  posts.tag,
  COUNT(comments.*) AS user_comments_tag
FROM users
INNER JOIN comments ON comments.user_id = users.id
LEFT JOIN posts ON posts.id = comments.post_id
GROUP BY users.id, posts.tag
ORDER BY user_comments_tag DESC
```

```
email                     |     tag     | user_comments_tag
--------------------------+-------------+-------------------
olivia.johnson1@email.com | video       |                 3
liam.jones3@email.com     | programming |                 3
noah.davis4@email.com     | video       |                 2
ava.williams2@email.com   | moto        |                 1
liam.jones3@email.com     | video       |                 1
liam.jones3@email.com     | moto        |                 1
noah.davis4@email.com     | moto        |                 1
emma.smith0@email.com     | moto        |                 1
olivia.johnson1@email.com | moto        |                 1
ava.williams2@email.com   | video       |                 1
ava.williams2@email.com   | books       |                 1
noah.davis4@email.com     | books       |                 1
```

---
#### But i will have problems with counting total comments for post tags
---

#### GROUP BY GROUPING SETS do the job!

```sql
SELECT
  users.email,
  posts.tag,
  COUNT(comments.*) AS user_comments_tag
FROM users
INNER JOIN comments ON comments.user_id = users.id
LEFT JOIN posts ON posts.id = comments.post_id
GROUP BY GROUPING SETS(users.email, posts.tag), posts.tag
ORDER BY users.email, user_comments_tag DESC, posts.tag NULLS LAST
```

```
email                     |     tag     | user_comments_tag
--------------------------+-------------+-------------------
ava.williams2@email.com   | books       |                 1
ava.williams2@email.com   | moto        |                 1
ava.williams2@email.com   | video       |                 1
emma.smith0@email.com     | moto        |                 1
liam.jones3@email.com     | programming |                 3
liam.jones3@email.com     | moto        |                 1
liam.jones3@email.com     | video       |                 1
noah.davis4@email.com     | video       |                 2
noah.davis4@email.com     | books       |                 1
noah.davis4@email.com     | moto        |                 1
olivia.johnson1@email.com | video       |                 3
olivia.johnson1@email.com | moto        |                 1
                          | video       |                 7
                          | moto        |                 5
                          | programming |                 3
                          | books       |                 2
```

but... not as i wanted

---

#### How about subquery
It will return correct rows and data but it is incredibly slow
```sql
SELECT
  users.email,
  posts.tag,
  COUNT(comments.*) AS user_comments_tag,
  (SELECT COUNT(comments.*)
   FROM comments
   INNER JOIN posts p ON comments.post_id = p.id
                      AND users.id = users.id
                      AND p.tag = posts.tag) AS total_comments
FROM users
INNER JOIN comments ON comments.user_id = users.id
LEFT JOIN posts ON posts.id = comments.post_id
GROUP BY users.id, posts.tag
ORDER BY users.id, user_comments_tag DESC
```

```
email                     |     tag     | user_comments_tag | total_comments
--------------------------+-------------+-------------------+----------------
emma.smith0@email.com     | moto        |                 1 |              5
olivia.johnson1@email.com | video       |                 3 |              7
olivia.johnson1@email.com | moto        |                 1 |              5
ava.williams2@email.com   | video       |                 1 |              7
ava.williams2@email.com   | books       |                 1 |              2
ava.williams2@email.com   | moto        |                 1 |              5
liam.jones3@email.com     | programming |                 3 |              3
liam.jones3@email.com     | video       |                 1 |              7
liam.jones3@email.com     | moto        |                 1 |              5
noah.davis4@email.com     | video       |                 2 |              7
noah.davis4@email.com     | books       |                 1 |              2
noah.davis4@email.com     | moto        |                 1 |              5

```

---
#### However, there's much better option!

```sql
SELECT DISTINCT ON (posts.tag, users.id)
  users.email,
  posts.tag,
  COUNT(comments.*) OVER(PARTITION BY comments.user_id, posts.tag) AS user_comments_tag,
  COUNT(comments.*) OVER(PARTITION BY posts.tag) AS total_tag_comments
FROM users
INNER JOIN comments ON comments.user_id = users.id
LEFT JOIN posts ON posts.id = comments.post_id
ORDER BY users.id
```

```
email                     |     tag     | user_comments_tag | total_tag_comments
--------------------------+-------------+-------------------+--------------------
emma.smith0@email.com     | moto        |                 1 |                  5
olivia.johnson1@email.com | moto        |                 1 |                  5
olivia.johnson1@email.com | video       |                 3 |                  7
ava.williams2@email.com   | books       |                 1 |                  2
ava.williams2@email.com   | moto        |                 1 |                  5
ava.williams2@email.com   | video       |                 1 |                  7
liam.jones3@email.com     | moto        |                 1 |                  5
liam.jones3@email.com     | programming |                 3 |                  3
liam.jones3@email.com     | video       |                 1 |                  7
noah.davis4@email.com     | books       |                 1 |                  2
noah.davis4@email.com     | moto        |                 1 |                  5
noah.davis4@email.com     | video       |                 2 |                  7

```
---

### How it works under the hood?
SQL Clauses hierarchy

* FROM
* WHERE
* GROUP BY
* HAVING
* **WINDOW**
* SELECT
* DISTINCT
* ORDER BY
* OFFSET
* LIMIT

---

### Partitioning

```
---------------------
| Record id.1 tag.1 |
| Record id.2 tag.1 |
| Record id.3 tag.2 |
| Record id.4 tag.2 |
| Record id.5 tag.3 |
---------------------
```

#### Partition by tag id

```
---------------------
| Record id.1 tag.1 |
| Record id.2 tag.1 | records count -> 2
|-------------------|
| Record id.3 tag.2 |
| Record id.4 tag.2 | records count -> 2
|-------------------|
| Record id.5 tag.3 | records count -> 1
---------------------
```

---

#### You can order your partition
Order by record id DESC

```
---------------------
| Record id.2 tag.1 |
| Record id.1 tag.1 |
|-------------------|
| Record id.4 tag.2 |
| Record id.3 tag.2 |
|-------------------|
| Record id.5 tag.3 |
---------------------
```

---

#### Use OVER without PARTITION

```
---------------------
| Record id.1 tag.1 |
| Record id.2 tag.1 |
| Record id.3 tag.2 |
| Record id.4 tag.2 |
| Record id.5 tag.3 |
---------------------
```

---

### After partitioning i can order columns

```sql
SELECT DISTINCT ON (posts.tag, users.id, total_tag_comments, user_comments_tag, users.email)
  users.email,
  posts.tag,
  COUNT(comments.*) OVER(PARTITION BY comments.user_id, posts.tag) AS user_comments_tag,
  COUNT(comments.*) OVER(PARTITION BY posts.tag) AS total_tag_comments
FROM users
INNER JOIN comments ON comments.user_id = users.id
LEFT JOIN posts ON posts.id = comments.post_id
ORDER BY total_tag_comments DESC, user_comments_tag DESC, posts.tag ASC, users.email ASC
```

```
email                     |     tag     | user_comments_tag | total_tag_comments
--------------------------+-------------+-------------------+--------------------
olivia.johnson1@email.com | video       |                 3 |                  7
noah.davis4@email.com     | video       |                 2 |                  7
ava.williams2@email.com   | video       |                 1 |                  7
liam.jones3@email.com     | video       |                 1 |                  7
ava.williams2@email.com   | moto        |                 1 |                  5
emma.smith0@email.com     | moto        |                 1 |                  5
liam.jones3@email.com     | moto        |                 1 |                  5
noah.davis4@email.com     | moto        |                 1 |                  5
olivia.johnson1@email.com | moto        |                 1 |                  5
liam.jones3@email.com     | programming |                 3 |                  3
ava.williams2@email.com   | books       |                 1 |                  2
noah.davis4@email.com     | books       |                 1 |                  2
```
---

### Define your windows

```sql
SELECT DISTINCT ON (posts.tag, users.id, total_tag_comments, user_comments_tag)
  users.email,
  posts.tag,
  COUNT(comments.*) OVER(by_user_and_post_tag) AS user_comments_tag,
  COUNT(comments.*) OVER(by_post_tag) AS total_tag_comments
FROM users
INNER JOIN comments ON comments.user_id = users.id
LEFT JOIN posts ON posts.id = comments.post_id
WINDOW
  by_post_tag AS (PARTITION BY posts.tag),
  by_user_and_post_tag AS (PARTITION BY comments.user_id, posts.tag)
ORDER BY total_tag_comments DESC, user_comments_tag DESC, posts.tag ASC, users.id ASC
```

---

### Benchmarks
Remember that following results come from postgresql db hosted on home-class computer

137 690 comments in database

* Group by option
- ~363,631 ms
* Window Function
- ~552,957 ms
* Sub select
- ~1394,544 ms
---

### Let's go one step further
and display same results in user profile dependent on user_id

```sql
SELECT DISTINCT ON (posts.tag, users.id, total_tag_comments, user_comments_tag)
  users.email,
  posts.tag,
  COUNT(comments.*) OVER(PARTITION BY comments.user_id, posts.tag) AS user_comments_tag,
  COUNT(comments.*) OVER(PARTITION BY posts.tag) AS total_tag_comments
FROM users
INNER JOIN comments ON comments.user_id = users.id
LEFT JOIN posts ON posts.id = comments.post_id
WHERE users.id = 2
ORDER BY total_tag_comments DESC, user_comments_tag DESC, posts.tag ASC, users.id ASC
```
```
email                     |  tag  | user_comments_tag | total_tag_comments
--------------------------+-------+-------------------+--------------------
olivia.johnson1@email.com | video |                 3 |                  3
olivia.johnson1@email.com | moto  |                 1 |                  1

```

But it's not what I expected
---

#### In this case we need to collect data before WHERE clause
#### Possible options
* SQL View
* Sub query select

---
```sql
SELECT * FROM
  (
    SELECT DISTINCT ON (posts.tag, users.id, total_tag_comments, user_comments_tag)
      users.id AS user_id,
      users.email,
      posts.tag,
      COUNT(comments.*) OVER(PARTITION BY comments.user_id, posts.tag) AS user_comments_tag,
      COUNT(comments.*) OVER(PARTITION BY posts.tag) AS total_tag_comments
    FROM users
    INNER JOIN comments ON comments.user_id = users.id
    LEFT JOIN posts ON posts.id = comments.post_id
    ORDER BY total_tag_comments DESC, user_comments_tag DESC, posts.tag ASC, users.id ASC
  ) t0
WHERE t0.user_id = 2
```
```
user_id |           email           |  tag  | user_comments_tag | total_tag_comments
--------+---------------------------+-------+-------------------+--------------------
      2 | olivia.johnson1@email.com | video |                 3 |                  7
      2 | olivia.johnson1@email.com | moto  |                 1 |                  5
```

---

### Using views might be quite dangerous
Remember if you are using SQL View with OVER clause inside selected records, it will collect results before WHERE clause executed on this view

---
```sql
SELECT * FROM top_activity_view WHERE user_id = 1
```
```
user_id |           email           |  tag  | user_comments_tag | total_tag_comments
--------+---------------------------+-------+-------------------+--------------------
      2 | olivia.johnson1@email.com | video |                 3 |                  7
      2 | olivia.johnson1@email.com | moto  |                 1 |                  5
```
---

### Let's go deeper!
I'll change the scenario a little bit
Every user in my database collected some points dependent on their overall activity
Next thing is to show how much points I need to beat user ahead of me, or how much points other user needs to beat me dependent on collected points
---
#### LEAD & LAG


```sql
SELECT
  id,
  email,
  points,
  LAG(points) OVER(ORDER BY points DESC, id ASC) AS prev_user_points,
  LEAD(points) OVER(ORDER BY points DESC, id ASC) AS next_user_points
FROM users
ORDER BY users.points DESC, id ASC;
```
```
id |           email           | points | prev_user_points | next_user_points
---+---------------------------+--------+------------------+------------------
 5 | noah.davis4@email.com     |    837 |                  |              734
 3 | ava.williams2@email.com   |    734 |              837 |              547
 2 | olivia.johnson1@email.com |    547 |              734 |              170
 4 | liam.jones3@email.com     |    170 |              547 |              104
 1 | emma.smith0@email.com     |    104 |              170 |                 
```
---

#### I would like to display last comment_id and post_id for each user
---

#### As always, subquery is an option

```sql
SELECT
  users.id,
  email,
  points,
  (SELECT post_id FROM comments WHERE user_id = users.id ORDER BY created_at DESC LIMIT 1),
  (SELECT id AS comment_id FROM comments WHERE user_id = users.id ORDER BY created_at DESC LIMIT 1)
FROM users
ORDER BY users.points DESC, id ASC
```
```
id |           email           | points | post_id | comment_id
---+---------------------------+--------+---------+------------
 5 | noah.davis4@email.com     |    837 |       9 |         15
 3 | ava.williams2@email.com   |    734 |       9 |         14
 2 | olivia.johnson1@email.com |    547 |       5 |          8
 4 | liam.jones3@email.com     |    170 |      10 |         17
 1 | emma.smith0@email.com     |    104 |       9 |         13
```
---

## LATERAL JOIN

---

#### Let's see how we can join this table only with one record from comments
```sql
SELECT
  users.id,
  email,
  points,
  comments.*
FROM users
LEFT JOIN LATERAL (
  SELECT
    post_id AS post_id,
    comments.id AS comment_id
  FROM comments
  WHERE comments.user_id = users.id
  ORDER BY created_at DESC
  LIMIT 1
) comments ON true
ORDER BY users.points DESC, id ASC
```
```
id |           email           | points | post_id | comment_id
---+---------------------------+--------+---------+------------
 5 | noah.davis4@email.com     |    837 |       9 |         15
 3 | ava.williams2@email.com   |    734 |       9 |         14
 2 | olivia.johnson1@email.com |    547 |       5 |          8
 4 | liam.jones3@email.com     |    170 |      10 |         17
 1 | emma.smith0@email.com     |    104 |       9 |         13
```
---

### How LATERAL JOIN works?
* Is executed as same as subquery, but will be executed same times as classic join
* We can select more than one row from query
* It can't be used as RIGHT JOIN

---

### Benchmarks
30 Users
137690 Comments

* Subselect 92,069 ms
* Lateral join 58,454 ms

---

#### Funfact
This is how we can display 'top users comments section' with their last comment and post
per tag with LATERAL JOIN

---

```sql
SELECT
  t0.user_id,
  t0.email,
  t0.tag,
  t0.user_comments,
  t0.tag_comments,
  last_comments.comment_id,
  last_comments.post_id
FROM
(
  SELECT DISTINCT ON (posts.tag, users.id, tag_comments, user_comments)
    users.id AS user_id,
    users.email,
    posts.tag,
    COUNT(comments.*) OVER(PARTITION BY comments.user_id, posts.tag) AS user_comments,
    COUNT(comments.*) OVER(PARTITION BY posts.tag) AS tag_comments,
    array_agg(comments.post_id) OVER(PARTITION BY comments.user_id, posts.tag) AS post_ids
  FROM users
  INNER JOIN comments ON comments.user_id = users.id
  LEFT JOIN posts ON posts.id = comments.post_id
  ORDER BY tag_comments DESC, user_comments DESC, posts.tag ASC, users.id ASC
) t0
INNER JOIN LATERAL (
  SELECT
    post_id,
    user_id,
    created_at,
    id AS comment_id
  FROM comments c WHERE t0.user_id = c.user_id AND c.post_id = ANY(t0.post_ids)
  ORDER BY c.created_at DESC LIMIT 1
) last_comments ON true
```
---

#### Results

```
user_id |           email           |     tag     | user_comments | tag_comments | comment_id | post_id
--------+---------------------------+-------------+---------------+--------------+------------+---------
      2 | olivia.johnson1@email.com | video       |             3 |            7 |          8 |       5
      5 | noah.davis4@email.com     | video       |             2 |            7 |         12 |       7
      3 | ava.williams2@email.com   | video       |             1 |            7 |          5 |       3
      4 | liam.jones3@email.com     | video       |             1 |            7 |         11 |       7
      1 | emma.smith0@email.com     | moto        |             1 |            5 |         13 |       9
      2 | olivia.johnson1@email.com | moto        |             1 |            5 |          1 |       1
      3 | ava.williams2@email.com   | moto        |             1 |            5 |         14 |       9
      4 | liam.jones3@email.com     | moto        |             1 |            5 |          2 |       1
      5 | noah.davis4@email.com     | moto        |             1 |            5 |         15 |       9
      4 | liam.jones3@email.com     | programming |             3 |            3 |         17 |      10
      3 | ava.williams2@email.com   | books       |             1 |            2 |          9 |       6
      5 | noah.davis4@email.com     | books       |             1 |            2 |         10 |       6
```
---

### Benchmarks
**Only for one tag**
- Subquery: Time: 53519,952 ms
- Lateral join: Time: 818,429 ms

---

## Summary
Any questions?
