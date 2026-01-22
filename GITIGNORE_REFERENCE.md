# Gitignore Best Practices Reference

This document provides a comprehensive reference for common patterns that should be ignored in version control.

## Environment & Configuration Files

```
.env
.env.local
.env.*.local
.env.production.local
config/secrets.json
```

## IDE & Editor Files

```
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.c9/
*.sublime-workspace
```

## Operating System Files

```
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

## Build Artifacts & Dependencies

```
dist/
build/
*.o
*.so
*.a
*.lib
node_modules/
venv/
*.egg-info/
.gradle/
```

## Runtime Files

```
*.log
*.pid
tmp/
temp/
cache/
```

## Development Tools

```
.vscode/settings.json
.idea/workspace.xml
.coverage
.pytest_cache/
htmlcov/
```

## Usage

Copy relevant patterns into your project's `.gitignore` file, adjusting as needed for your specific tech stack and development environment.
