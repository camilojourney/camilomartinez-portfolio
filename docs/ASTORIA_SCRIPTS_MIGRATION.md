# 📦 Astoria Scripts Migration Summary

> **Date:** October 7, 2025  
> **Action:** Moved Python scripts from `scripts/one-off/` to `backend/app/scripts/astoria/`

---

## 🎯 **Why This Change?**

The Astoria Python scripts were originally in the root-level `scripts/one-off/` directory, but this created several issues:

1. **❌ Dependency Management:** Scripts needed backend Poetry dependencies but lived outside backend
2. **❌ Path Complexity:** Celery tasks had to navigate complex relative paths
3. **❌ Organization:** Mixed frontend (Node.js) and backend (Python) scripts in same directory
4. **❌ Execution Context:** Scripts assumed they were run from project root

### ✅ **Solution: Move to Backend**

New location: `backend/app/scripts/astoria/`

**Benefits:**
- ✅ Scripts live with their Poetry dependencies
- ✅ Simpler imports from Celery workers
- ✅ Clear separation: Python (backend) vs JavaScript (root scripts/)
- ✅ Can be run from backend directory using Poetry

---

## 📂 **What Was Moved**

### **Old Locations → New Locations**

| Old Path | New Path |
|----------|----------|
| `scripts/one-off/generate_astoria_base_map.py` | `backend/app/scripts/astoria/generate_base_map.py` |
| `scripts/one-off/update_astoria_progress.py` | `backend/app/scripts/astoria/update_progress.py` |

### **New Directory Structure**

```
backend/
└── app/
    └── scripts/           ← NEW: Backend scripts package
        ├── __init__.py
        └── astoria/       ← NEW: Astoria-specific scripts
            ├── __init__.py
            ├── generate_base_map.py      ← Moved & renamed
            └── update_progress.py        ← Moved & renamed
```

---

## 🔄 **Files Updated**

### **1. Celery Worker Task**

**File:** `backend/app/workers/tasks/astoria.py`

**Before:**
```python
# Get project root (assuming backend is in /backend)
project_root = Path(__file__).parent.parent.parent.parent.parent
script_path = project_root / "scripts" / "one-off" / "update_astoria_progress.py"
```

**After:**
```python
# Get script path (backend/app/workers/tasks -> backend/app/scripts/astoria)
backend_dir = Path(__file__).parent.parent.parent
script_path = backend_dir / "scripts" / "astoria" / "update_progress.py"
project_root = backend_dir.parent
```

**Why:** Simpler path navigation, script is now in the same Python package structure.

---

### **2. Package.json Scripts**

**File:** `package.json`

**Before:**
```json
{
  "map:setup": "source .venv/bin/activate && python3 scripts/data/generate_astoria_base_map.py",
  "map:update": "source .venv/bin/activate && python3 scripts/data/update_astoria_progress.py"
}
```

**After:**
```json
{
  "map:setup": "cd backend && poetry run python app/scripts/astoria/generate_base_map.py",
  "map:update": "cd backend && poetry run python app/scripts/astoria/update_progress.py"
}
```

**Why:** Uses Poetry to manage Python environment, runs from backend directory.

---

### **3. Script Internal Paths**

**Both scripts updated:**

**Before:**
```python
# Hardcoded relative paths from project root
OUTPUT_DIR_PUBLIC = "public/data/astoria-conquest"
OUTPUT_DIR_CACHE = "backend/data/astoria-conquest/cache"
OSMNX_CACHE_DIR = "backend/data/osmnx-cache"
```

**After:**
```python
# Dynamic paths using pathlib
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent

OUTPUT_DIR_PUBLIC = PROJECT_ROOT / "public" / "data" / "astoria-conquest"
OUTPUT_DIR_CACHE = PROJECT_ROOT / "backend" / "data" / "astoria-conquest" / "cache"
OSMNX_CACHE_DIR = PROJECT_ROOT / "backend" / "data" / "osmnx-cache"
```

**Why:** Scripts now work regardless of where they're called from.

---

## 📝 **Documentation Updates Needed**

The following documentation files still reference the old paths and need updating:

### **1. Scripts Audit**
- **File:** `docs/SCRIPTS_AUDIT.md`
- **Lines:** 210, 222, 255, 256, 399, 494, 533
- **Update:** Change all references from `scripts/one-off/` to `backend/app/scripts/astoria/`

### **2. Scripts README**
- **File:** `docs/operations/scripts/README.md`
- **Lines:** 24, 99, 100
- **Update:** Change command examples to use new path

### **3. Workers Migration Summary**
- **File:** `docs/updates/2025-10_WORKERS_MIGRATION_SUMMARY.md`
- **Line:** 34
- **Update:** Update path reference

---

## ✅ **How to Use New Paths**

### **Running Scripts Manually**

**Old way (DON'T use anymore):**
```bash
python scripts/one-off/generate_astoria_base_map.py
```

**New way:**
```bash
# Option 1: From project root using npm
npm run map:setup
npm run map:update

# Option 2: From backend directory
cd backend
poetry run python app/scripts/astoria/generate_base_map.py
poetry run python app/scripts/astoria/update_progress.py

# Option 3: If Poetry shell is already active
cd backend
poetry shell
python app/scripts/astoria/generate_base_map.py
```

### **Importing in Python Code**

**New import paths:**
```python
# From Celery workers or other backend code
from app.scripts.astoria.generate_base_map import remove_all_dead_ends
from app.scripts.astoria.update_progress import haversine
```

---

## 🧪 **Testing the Changes**

### **1. Test Generate Base Map**
```bash
cd backend
poetry run python app/scripts/astoria/generate_base_map.py
```

**Expected output:**
```
🚀 Starting One-Time Generation of Astoria Base Map...
   -> Fetching neighborhood boundaries from NYC Open Data...
   -> Fetching street network from OpenStreetMap...
   -> Cleaning the network (removing dead ends)...
   -> Final network created with X nodes and Y edges.
   -> Saving processed files...
      - Saved Python graph object to: backend/data/astoria-conquest/cache/astoria_graph.pkl
      - Saved web-ready base map to: public/data/astoria-conquest/astoria-base-map.geojson
✅ Success! Foundational map assets have been created.
```

### **2. Test Update Progress**
```bash
cd backend
poetry run python app/scripts/astoria/update_progress.py
```

**Expected output:**
```
🔄 Starting Astoria Conquest Progress Update...
   -> Loading cached base map graph...
   -> Base map loaded successfully.
   -> Fetching Strava polylines from database...
   -> Found X runs matching the criteria.
   -> Matching all runs to the street network...
   -> Found Y unique street segments covered in total.
   -> Generating and saving updated progress files...
✅ Success! Progress files have been updated.
```

### **3. Test Celery Task**
```bash
cd backend
poetry run celery -A app.workers.celery_app worker -B --loglevel=info
```

**Then trigger manually:**
```bash
# In Python shell
from app.workers.tasks.astoria import update_progress
result = update_progress()
print(result)
```

**Expected:** Task should find script and execute successfully.

---

## 🚨 **Breaking Changes**

### **What Still Works:**
- ✅ Celery scheduled tasks (automatically updated)
- ✅ npm scripts (`npm run map:setup`, `npm run map:update`)
- ✅ Frontend map display (GeoJSON files in same location)

### **What Breaks:**
- ❌ Direct calls to old paths: `python scripts/one-off/generate_astoria_base_map.py`
- ❌ Old npm scripts if not updated
- ❌ Any external scripts/docs referencing old paths

---

## 📊 **File Checklist**

- [x] Created `backend/app/scripts/__init__.py`
- [x] Created `backend/app/scripts/astoria/__init__.py`
- [x] Created `backend/app/scripts/astoria/generate_base_map.py` (moved + updated)
- [x] Created `backend/app/scripts/astoria/update_progress.py` (moved + updated)
- [x] Updated `backend/app/workers/tasks/astoria.py` (Celery task)
- [x] Updated `package.json` (npm scripts)
- [ ] Update `docs/SCRIPTS_AUDIT.md` (documentation)
- [ ] Update `docs/operations/scripts/README.md` (documentation)
- [ ] Update `docs/updates/2025-10_WORKERS_MIGRATION_SUMMARY.md` (documentation)
- [ ] Test scripts manually
- [ ] Test Celery task execution
- [ ] Delete old files from `scripts/one-off/` (after verification)

---

## 🎓 **Key Learnings**

### **1. Path Management**
Always use `pathlib.Path` for dynamic path resolution:
```python
SCRIPT_DIR = Path(__file__).parent  # Where am I?
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent  # Navigate up
```

### **2. Package Structure**
Backend scripts should live in `backend/app/` to:
- Access Poetry dependencies
- Be importable from other backend code
- Follow Python package conventions

### **3. Execution Context**
Scripts can be run from:
- Project root (via npm scripts)
- Backend directory (via poetry run)
- Celery workers (via subprocess)

Always calculate paths dynamically!

---

*For questions, see the [Scripts Audit documentation](./SCRIPTS_AUDIT.md).*
