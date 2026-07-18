# AlgoSync Software Design Document

## Project Overview

AlgoSync is an open-source browser extension that automatically synchronizes accepted coding solutions from supported coding platforms to GitHub.

Currently Supported Platforms

- LeetCode
- GeeksforGeeks

---

## Objectives

- Automatic GitHub synchronization
- Clean repository structure
- Topic-wise organization
- Problem README generation
- Multi-solution support
- Professional portfolio repository generation

---

## Non Goals

- Online code editor
- Contest tracking
- User authentication outside GitHub
- Cloud storage

---

## Core Features

- GitHub OAuth
- Repository Selection
- Auto Sync
- Multi Solution Mode
- README Generator
- Topic Detection

---

## Technology Stack

- Manifest V3
- JavaScript / TypeScript
- React (UI)
- Tailwind CSS
- GitHub REST API

---

## Design Principles

- Single Responsibility
- Modular
- Reusable
- Easy to Extend
- No duplicated logic