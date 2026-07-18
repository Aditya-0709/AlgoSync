# Architecture

Browser

↓

Content Script

↓

Platform Parser

↓

Problem Model

↓

Sync Service

↓

README Generator

↓

GitHub Service

↓

Repository

---

## Module Responsibilities

Platform Parser

Responsible for:

- extracting data

Never:

- upload files
- generate markdown

---

README Generator

Responsible for:

- markdown generation only

Never:

- scrape websites
- upload files

---

GitHub Service

Responsible for:

- GitHub API

Never:

- parse HTML
- generate README

---

UI

Responsible for:

- rendering
- user interaction

Never:

- upload
- scrape