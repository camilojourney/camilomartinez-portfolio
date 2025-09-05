# Quarto Projects Setup Guide

This guide documents the complete setup process for Quarto projects with Python/Jupyter integration. Choose your approach based on your deployment needs.

## Prerequisites

- **Quarto installed globally**: Download from [quarto.org](https://quarto.org/docs/get-started/)
- **Python 3.8+** installed on your system
- **Git** for version control

## Choose Your Approach

### 🌐 **Option A: Standalone Website** 
*(For GitHub Pages, Netlify, or dedicated Quarto sites)*
- Creates a complete website with navigation
- Self-hosted project with multiple pages
- Best for: Comprehensive project documentation

### 📁 **Option B: Portfolio Integration** 
*(For embedding in existing portfolios like Vercel/Next.js)*
- Creates standalone HTML files
- Integrates into existing website structure
- Best for: Adding analysis to personal portfolio

---

---

## Project Setup Workflow

### Common Setup (Both Options)

#### 1. Create Project Structure

```bash
# Navigate to your projects directory
cd /Users/camilo/camilomartinez-portfolio/backend/projects_quarto

# Create new project folder
mkdir your-project-name
cd your-project-name
```

#### 2. Set Up Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip (recommended)
pip install --upgrade pip
```

#### 3. Install Required Python Packages

##### Core Jupyter Ecosystem (REQUIRED for Quarto)
```bash
pip install jupyter nbformat nbclient ipykernel
```

##### Analysis Packages (customize based on your needs)
```bash
pip install pandas requests matplotlib numpy seaborn plotly
```

##### Geospatial Packages (if needed)
```bash
pip install geopandas osmnx folium shapely
```

##### Web/API Packages (if needed)
```bash
pip install httpx beautifulsoup4 streamlit
```

#### 4. Register Jupyter Kernel

```bash
# Register your project kernel (replace 'your-project-name' with actual name)
python -m ipykernel install --user --name=your-project-name
```

---

## 🌐 Option A: Standalone Website Setup

### 5A. Create Quarto Website Files

### 5A. Create Quarto Website Files

#### Create `_quarto.yml` (Project Configuration)
```yaml
project:
  type: website
  title: "Your Project Title"

website:
  title: "Your Project"
  navbar:
    left:
      - href: index.qmd
        text: Home
      - href: analysis.qmd
        text: Analysis
    tools:
      - icon: github
        href: https://github.com/yourusername/your-repo
  page-footer: 
    center: "© 2024 Your Name"

format:
  html:
    theme: cosmo
    toc: true
    code-fold: true
    code-summary: "Show code"
    code-overflow: wrap
    fig-width: 10
    fig-height: 6

execute:
  freeze: auto
  cache: true
```

#### Create `index.qmd` (Main Document)
```yaml
---
title: "Your Project Title"
format: html
jupyter: your-project-name  # Must match your kernel name
execute:
  echo: true
  warning: true
  message: true
  error: true
---

## Introduction

Your project description here.

```{python}
import pandas as pd
import numpy as np
print("Setup complete!")
```
```

### 6A. Test Website Setup

```bash
# Test Quarto rendering
quarto render

# Start preview server
quarto preview
```

---

## 📁 Option B: Portfolio Integration Setup

### 5B. Create Standalone Document

#### Create your analysis file (e.g., `astoria-analysis.qmd`)
```yaml
---
title: "Astoria Conquest"
format: 
  html:
    theme: cosmo
    toc: true
    code-fold: true
    code-summary: "Show code"
    embed-resources: true  # Important: bundles everything into one HTML file
    standalone: true       # Creates self-contained HTML
jupyter: your-project-name
execute:
  echo: true
  warning: true
  message: true
  error: true
---

## Your Analysis

Your project content here...

```{python}
import pandas as pd
import numpy as np
print("Analysis ready!")
```
```

### 6B. Render for Portfolio

```bash
# Render to standalone HTML (no _quarto.yml needed)
quarto render astoria-analysis.qmd

# This creates: astoria-analysis.html (self-contained file)
# Copy this HTML file to your portfolio's public/projects folder
```

### 7B. Integrate with Portfolio

#### Option 1: Direct Embed
```jsx
// In your Next.js/React component
<iframe 
  src="/projects/astoria-analysis.html" 
  width="100%" 
  height="800px"
  frameBorder="0"
/>
```

#### Option 2: Dedicated Route
```javascript
// Create route: /projects/astoria-analysis
// Serve the HTML file directly
```

#### Option 3: Link to Analysis
```jsx
<a 
  href="/projects/astoria-analysis.html" 
  target="_blank"
  className="btn btn-primary"
>
  View Full Analysis
</a>
```

---

## Supporting Files (Both Options)
### Create `requirements.txt`
```txt
# Core Jupyter (REQUIRED)
jupyter>=1.0.0
nbformat>=5.0.0
nbclient>=0.10.0
ipykernel>=6.0.0

# Analysis packages
pandas>=1.5.0
numpy>=1.20.0
matplotlib>=3.5.0
requests>=2.28.0

# Add your specific packages here
```

### Create `.gitignore`
```gitignore
# Virtual environment
.venv/
venv/

# Jupyter/Quarto cache
.quarto/
*_cache/
*_files/

# Python cache
__pycache__/
*.pyc
*.pyo

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
```

### 7. Test Your Setup

```bash
# Test kernel availability
jupyter kernelspec list

# For Option A (Website):
quarto render
quarto preview

# For Option B (Portfolio):
quarto render your-analysis.qmd
```

---

## Quick Start Commands

### 🌐 For Standalone Website:
```bash
# Setup
mkdir project-name && cd project-name
python3 -m venv .venv && source .venv/bin/activate
pip install jupyter nbformat nbclient ipykernel pandas requests matplotlib
python -m ipykernel install --user --name=project-name

# Create files: _quarto.yml, index.qmd, requirements.txt

# Test
quarto render && quarto preview
```

### 📁 For Portfolio Integration:
```bash
# Setup
mkdir project-name && cd project-name
python3 -m venv .venv && source .venv/bin/activate
pip install jupyter nbformat nbclient ipykernel pandas requests matplotlib
python -m ipykernel install --user --name=project-name

# Create files: your-analysis.qmd, requirements.txt (no _quarto.yml needed)

# Render
quarto render your-analysis.qmd
# Copy the generated HTML to your portfolio
```

## Common Issues & Solutions

### Issue: "ModuleNotFoundError: No module named 'nbformat'"
**Solution**: Install complete Jupyter ecosystem
```bash
pip install jupyter nbformat nbclient
```

### Issue: "Kernel not found"
**Solution**: Re-register your kernel
```bash
python -m ipykernel install --user --name=your-project-name
```

### Issue: "YAML parsing error"
**Solution**: Check indentation in `_quarto.yml` and document headers. Use spaces, not tabs.

### Issue: Code cells don't execute
**Solution**: Ensure kernel name in YAML matches registered kernel:
```yaml
jupyter: your-project-name  # Must match exactly
```

## Project Structure Templates

### 🌐 Standalone Website Structure:
```
your-project-name/
├── .venv/                 # Virtual environment
├── .quarto/              # Quarto cache (auto-generated)
├── _quarto.yml           # Project configuration (REQUIRED)
├── index.qmd             # Main document
├── analysis.qmd          # Additional pages
├── requirements.txt      # Python dependencies
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

### 📁 Portfolio Integration Structure:
```
your-project-name/
├── .venv/                 # Virtual environment
├── .quarto/              # Quarto cache (auto-generated)
├── your-analysis.qmd     # Single analysis document
├── your-analysis.html    # Generated HTML (copy to portfolio)
├── requirements.txt      # Python dependencies
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

## Notes

- **Always activate your virtual environment** before working: `source .venv/bin/activate`
- **Kernel name must match** between `jupyter:` in YAML and registered kernel name
- **Install Jupyter ecosystem first** before analysis packages
- **Test rendering early** to catch setup issues quickly

## Troubleshooting Checklist

If Quarto isn't working, check:

1. ✅ Virtual environment activated
2. ✅ Jupyter packages installed (`jupyter`, `nbformat`, `nbclient`)
3. ✅ Kernel registered and listed in `jupyter kernelspec list`
4. ✅ Kernel name matches in YAML header
5. ✅ No YAML syntax errors (proper indentation)
6. ✅ Required packages installed for your analysis

---

*Last updated: September 2024*
