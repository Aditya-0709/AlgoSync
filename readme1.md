<div align="center">

<img src="assets/octocode.png" alt="AlgoSync Logo" width="220"/>

# 🚀 AlgoSync

### Automatically sync and organize your coding solutions from **LeetCode** & **GeeksForGeeks** directly to GitHub.

<p>
A modern browser extension built for developers who want an organized coding portfolio with automatic synchronization, structured repositories, and multi-solution support.
</p>

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform](https://img.shields.io/badge/Platforms-LeetCode%20%7C%20GeeksForGeeks-orange)
![Browser](https://img.shields.io/badge/Browser-Chrome%20%7C%20Firefox-success)
![JavaScript](https://img.shields.io/badge/Built%20With-JavaScript-yellow)

</div>

---

# ✨ Features

- 🔄 Automatically sync accepted solutions to GitHub
- 🟢 LeetCode support
- 🔵 GeeksForGeeks support
- 📂 Organized repository structure
- 📝 Automatic README generation
- 📚 Platform-wise README files
- 🧠 Multi-solution uploads
  - Brute Force
  - Better
  - Optimal
- 📄 Individual problem README
- 📈 Progress tracking
- ⚡ Fast GitHub synchronization
- 🔒 GitHub OAuth authentication
- 🧩 Modular architecture
- 🌐 Chrome & Firefox support

---

# 📸 Screenshots

> Add screenshots of:

- Extension Popup
- GitHub Repository
- LeetCode Upload
- GeeksForGeeks Upload

Example:

```text
assets/screenshots/
    popup.png
    repository.png
    leetcode.png
    gfg.png
```

---

# 📌 Supported Platforms

| Platform | Status |
|----------|:------:|
| LeetCode | ✅ |
| GeeksForGeeks | ✅ |

---

# 📁 Repository Structure

```
Repository
│
├── LeetCode
│   ├── Arrays
│   ├── Strings
│   ├── Trees
│   └── ...
│
└── GeeksForGeeks
    ├── Arrays
    ├── Graphs
    ├── DP
    └── ...
```

---

# 📝 Generated Problem Structure

```
LeetCode/
└── 0001-two-sum/
    ├── README.md
    ├── BruteForce.java
    ├── Better.java
    ├── Optimal.java
    └── NOTES.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/Aditya-0709/AlgoSync.git

cd AlgoSync
```

---

## Install Dependencies

```bash
npm install
```

---

## Build Extension

```bash
npm run build
```

---

## Load into Chrome

1. Open

```
chrome://extensions
```

2. Enable **Developer Mode**

3. Click **Load unpacked**

4. Select

```
dist/chrome
```

Done 🎉

---

# 🦊 Firefox

Build

```bash
npm run build
```

Open

```
about:debugging
```

Load

```
dist/firefox
```

---

# 🚀 Usage

1. Install AlgoSync
2. Login with GitHub
3. Select or create a repository
4. Solve a problem on LeetCode or GeeksForGeeks
5. Submit an Accepted solution
6. AlgoSync automatically uploads:

- Solution
- README
- NOTES (optional)
- Updates platform README
- Updates root README

---

# 🏗 Architecture

```
UI
│
├── Popup
├── Welcome
└── Dashboard
        │
        ▼
Services
│
├── Sync Service
├── Platform Service
└── Storage Service
        │
        ▼
Models
│
├── Problem
├── Solution
├── Repository
└── Statistics
        │
        ▼
Parsers
│
├── LeetCode
└── GeeksForGeeks
        │
        ▼
Generators
│
├── Root README
├── Platform README
├── Question README
└── Folder Generator
        │
        ▼
GitHub
│
├── API
├── OAuth
├── Repository
└── Uploader
```

---

# 📂 Project Structure

```
scripts/
│
├── github/
├── generators/
├── parsers/
├── services/
├── models/
├── constants/
├── utils/
│
├── popup.js
├── welcome.js
├── content.js
└── background.js
```

---

# 🛠 Development

Install

```bash
npm install
```

Build

```bash
npm run build
```

Run Tests

```bash
npm test
```

Format

```bash
npm run format
```

Lint

```bash
npm run lint
```

---

# 🛣 Roadmap

- [x] LeetCode Support
- [x] GeeksForGeeks Support
- [x] Automatic GitHub Sync
- [x] Multi-Solution Upload
- [x] Automatic README Generation
- [x] Modular Architecture
- [x] Chrome Support
- [x] Firefox Support
- [ ] Chrome Web Store
- [ ] Firefox Add-on Store
- [ ] Codeforces Support
- [ ] HackerRank Support
- [ ] InterviewBit Support

---

# 🤝 Contributing

Contributions, feature requests and bug reports are welcome.

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/my-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature/my-feature
```

5. Open a Pull Request

---

# 🙏 Acknowledgements

AlgoSync was originally inspired by **LeetHub v2**.

The project has since been significantly redesigned and enhanced with:

- Modular Architecture
- GeeksForGeeks Support
- Multi-Solution Upload
- Automatic README Generation
- Improved Repository Organization
- Dedicated Service Layer
- Domain Models
- GitHub Abstraction Layer

---

# 📄 License

This project is licensed under the MIT License.

See the **LICENSE** file for details.

---

<div align="center">

### ⭐ If you find AlgoSync useful, consider giving this repository a star!

Made with ❤️ by **Aditya Garg**

</div>