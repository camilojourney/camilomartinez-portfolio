# 🗄️ Alembic Database Migrations Guide

> **Status:** Authoritative · **Last Updated:** October 7, 2025  
> **Owner:** Backend Team · **For:** All developers working with database schema

---

## 📖 Table of Contents
- [What is Alembic?](#what-is-alembic)
- [Quick Start](#quick-start)
- [Common Commands](#common-commands)
- [Creating Migrations](#creating-migrations)
- [Understanding Migration Files](#understanding-migration-files)
- [Applying Migrations](#applying-migrations)
- [Rolling Back Changes](#rolling-back-changes)
- [Migration Chain](#migration-chain)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Real-World Scenarios](#real-world-scenarios)

---

## 🎯 What is Alembic?

**Alembic is a database migration tool for SQLAlchemy.** Think of it as **Git for your database schema** - it tracks changes to your database structure over time and allows you to apply or rollback those changes reliably.

### Why Use Alembic?

✅ **Version Control** - Every schema change is tracked and documented  
✅ **Reproducibility** - Team members can sync their databases easily  
✅ **Safety** - Rollback capabilities if something goes wrong  
✅ **CI/CD Ready** - Automate database updates in deployment pipelines  
✅ **Collaboration** - Multiple developers can work on schema changes without conflicts  

---

## 🚀 Quick Start

### Prerequisites
```bash
cd backend
poetry install  # Alembic is already in dependencies
```

### Check Current Status
```bash
poetry run alembic current
# Output: 0015_add_schema_embedding_index (head)
```

### Apply All Pending Migrations
```bash
poetry run alembic upgrade head
```

---

## 📋 Common Commands

### Information Commands
```bash
# Show current migration version
poetry run alembic current

# Show migration history
poetry run alembic history

# Show pending migrations
poetry run alembic history --verbose
```

### Migration Creation
```bash
# Create empty migration (you write the code)
poetry run alembic revision -m "description"

# Auto-detect changes from models (recommended!)
poetry run alembic revision --autogenerate -m "description"
```

### Applying Migrations
```bash
# Apply all pending migrations
poetry run alembic upgrade head

# Apply next migration only
poetry run alembic upgrade +1

# Apply to specific version
poetry run alembic upgrade 0015_add_schema_embedding_index
```

### Rolling Back
```bash
# Rollback one migration
poetry run alembic downgrade -1

# Rollback two migrations
poetry run alembic downgrade -2

# Rollback to specific version
poetry run alembic downgrade 0014_create_materialized_views

# Rollback all migrations
poetry run alembic downgrade base
```

### Special Commands
```bash
# Mark database at version without running migrations
poetry run alembic stamp head

# Mark at specific version
poetry run alembic stamp 0015_add_schema_embedding_index
```

---

## 🛠️ Creating Migrations

### Method 1: Auto-Generate (Recommended)

**Step 1:** Modify your SQLAlchemy model
```python
# backend/app/models/whoop.py
from sqlalchemy import Column, Text

class WHOOPWorkout(Base):
    __tablename__ = "whoop_workouts"
    
    # ... existing columns ...
    
    notes = Column(Text, nullable=True)  # ← ADD THIS
```

**Step 2:** Generate migration
```bash
cd backend
poetry run alembic revision --autogenerate -m "add notes to workouts"
```

**Step 3:** Review generated file
```python
# alembic/versions/0016_add_notes_to_workouts.py
def upgrade():
    op.add_column('whoop_workouts', 
                  sa.Column('notes', sa.Text(), nullable=True))

def downgrade():
    op.drop_column('whoop_workouts', 'notes')
```

**Step 4:** Apply migration
```bash
poetry run alembic upgrade head
```

### Method 2: Manual Migration

**Step 1:** Create empty migration
```bash
poetry run alembic revision -m "add custom index"
```

**Step 2:** Edit the generated file
```python
# alembic/versions/0016_add_custom_index.py
def upgrade():
    op.create_index(
        'idx_workout_start_time',
        'whoop_workouts',
        ['start_time'],
        postgresql_using='btree'
    )

def downgrade():
    op.drop_index('idx_workout_start_time', 'whoop_workouts')
```

**Step 3:** Apply migration
```bash
poetry run alembic upgrade head
```

---

## 📄 Understanding Migration Files

### Anatomy of a Migration
```python
"""Add notes to workouts"""  # ← Description

from alembic import op
import sqlalchemy as sa

# Revision identifiers
revision = "0016_add_notes_to_workouts"  # ← This migration's ID
down_revision = "0015_add_schema_embedding_index"  # ← Previous migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply changes - moves database FORWARD"""
    op.add_column('whoop_workouts', 
                  sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    """Undo changes - moves database BACKWARD"""
    op.drop_column('whoop_workouts', 'notes')
```

### Key Components

| Component | Purpose | Example |
|-----------|---------|---------|
| `revision` | Unique ID for this migration | `"0016_add_notes_to_workouts"` |
| `down_revision` | Previous migration in chain | `"0015_add_schema_embedding_index"` |
| `upgrade()` | SQL operations to apply changes | Add column, create table, etc. |
| `downgrade()` | SQL operations to undo changes | Drop column, drop table, etc. |

---

## 🔄 Migration Chain

Migrations form a **linked list** structure:

```
0012 → 0013 → 0014 → 0015 → 0016 (head)
       ↑      ↑      ↑      ↑
       |      |      |      |
    down_  down_  down_  down_
   revision revision revision revision
```

### How It Works

Each migration knows which one came before it via `down_revision`:

```python
# 0015 knows that 0014 came before it
revision = "0015_add_schema_embedding_index"
down_revision = "0014_create_materialized_views"

# 0016 knows that 0015 came before it
revision = "0016_add_notes_to_workouts"
down_revision = "0015_add_schema_embedding_index"
```

### Chain Navigation

**Forward (upgrade):**
```
Current: 0014
↓
Run upgrade() from 0015
↓
Current: 0015
↓
Run upgrade() from 0016
↓
Current: 0016 (head)
```

**Backward (downgrade):**
```
Current: 0016 (head)
↓
Run downgrade() from 0016
↓
Current: 0015
↓
Run downgrade() from 0015
↓
Current: 0014
```

---

## ⚡ Applying Migrations

### Development Workflow
```bash
# 1. Pull latest code
git pull origin main

# 2. Apply any new migrations
cd backend
poetry run alembic upgrade head

# 3. Start your server
poetry run uvicorn app.main:app --reload
```

### Production Deployment
```bash
# Automated in CI/CD pipeline:
- name: Run Database Migrations
  run: |
    cd backend
    poetry run alembic upgrade head
  
- name: Start Application
  run: |
    poetry run uvicorn app.main:app --host 0.0.0.0 --port 9000
```

### Checking Before Deploy
```bash
# See what will be applied
poetry run alembic current
poetry run alembic history

# Test migration on staging first!
# If successful, deploy to production
```

---

## ⏪ Rolling Back Changes

### When to Rollback

- Migration broke production
- Data corruption occurred
- Need to test different schema version
- Reverting a feature

### Rollback Examples

**Scenario 1: Last migration broke something**
```bash
# Go back one version
poetry run alembic downgrade -1

# Fix the issue, update migration file
# Apply again
poetry run alembic upgrade head
```

**Scenario 2: Need to go back 3 migrations**
```bash
# Rollback 3 steps
poetry run alembic downgrade -3

# Or target specific version
poetry run alembic downgrade 0013_standardize_milli
```

**Scenario 3: Complete reset**
```bash
# Remove all migrations (DANGER!)
poetry run alembic downgrade base

# Start fresh
poetry run alembic upgrade head
```

---

## 🔗 Best Practices

### ✅ DO

1. **Always review auto-generated migrations**
   ```bash
   alembic revision --autogenerate -m "add column"
   # Check the generated file before applying!
   ```

2. **Test migrations on local/staging first**
   ```bash
   # Never run untested migrations in production
   ```

3. **Keep migrations small and focused**
   ```bash
   # Good: One feature per migration
   alembic revision -m "add workout notes"
   
   # Bad: Everything at once
   alembic revision -m "refactor entire schema"
   ```

4. **Write descriptive migration names**
   ```bash
   # Good
   alembic revision -m "add heart_rate_zones to workouts"
   
   # Bad
   alembic revision -m "update"
   ```

5. **Always implement downgrade()**
   ```python
   def upgrade():
       op.add_column('users', sa.Column('email', sa.String(255)))
   
   def downgrade():
       op.drop_column('users', 'email')  # ← Don't leave this empty!
   ```

### ❌ DON'T

1. **Don't edit applied migrations**
   ```bash
   # If 0015 is already in production, don't modify it!
   # Create a new migration instead
   ```

2. **Don't skip migrations**
   ```bash
   # Bad: Jump from 0013 to 0016
   alembic upgrade 0016
   
   # Good: Apply all in sequence
   alembic upgrade head
   ```

3. **Don't commit database changes manually**
   ```sql
   -- Bad: Manually running SQL in production
   ALTER TABLE users ADD COLUMN email VARCHAR(255);
   
   -- Good: Create migration first
   ```

4. **Don't delete migration files**
   ```bash
   # If a migration is applied, the file MUST stay in Git
   # Even if you rollback, keep the file
   ```

---

## 🐛 Troubleshooting

### Problem: "Can't locate revision identified by 'xxxx'"

**Cause:** Broken migration chain - `down_revision` points to non-existent migration

**Solution:**
```bash
# Find the mismatch
cd backend/alembic/versions
grep -n "revision = " *.py
grep -n "down_revision = " *.py

# Fix the down_revision to match actual revision name
```

**Example from our codebase:**
```python
# 0014 was looking for:
down_revision = "0013_standardize_milli_suffix"  # ❌ Wrong!

# But 0013 was actually:
revision = "0013_standardize_milli"  # ✅ Correct

# Fix 0014:
down_revision = "0013_standardize_milli"  # ✅ Now matches!
```

### Problem: "ModuleNotFoundError: No module named 'asyncpg'"

**Cause:** Missing database driver

**Solution:**
```bash
cd backend
poetry add asyncpg
```

### Problem: "Target database is not up to date"

**Cause:** Migrations exist that haven't been applied

**Solution:**
```bash
# Apply pending migrations
poetry run alembic upgrade head
```

### Problem: "Database already has the table/column"

**Cause:** Database manually modified OR `alembic_version` table out of sync

**Solution:**
```bash
# Mark database as current without running migrations
poetry run alembic stamp head
```

### Problem: "Can't drop table - dependent objects exist"

**Cause:** Migration tries to drop table with foreign keys or views

**Solution:**
```python
def upgrade():
    # Drop dependent views first
    op.execute("DROP MATERIALIZED VIEW IF EXISTS run_performance_details CASCADE")
    
    # Now safe to drop table
    op.drop_table('activity_correlations')
```

---

## 🌍 Real-World Scenarios

### Scenario 1: New Feature - Workout Notes

**Requirement:** Users want to add notes to their workouts

```python
# 1. Update model
# app/models/whoop.py
class WHOOPWorkout(Base):
    notes = Column(Text, nullable=True)

# 2. Generate migration
poetry run alembic revision --autogenerate -m "add workout notes"

# 3. Review and apply
poetry run alembic upgrade head
```

### Scenario 2: Performance - Add Index

**Requirement:** Queries on `start_time` are slow

```python
# 1. Create manual migration
poetry run alembic revision -m "add index on workout start time"

# 2. Edit migration file
def upgrade():
    op.create_index(
        'idx_workout_start_time',
        'whoop_workouts',
        ['start_time']
    )

def downgrade():
    op.drop_index('idx_workout_start_time')

# 3. Apply
poetry run alembic upgrade head
```

### Scenario 3: Onboarding New Developer

**Task:** Get new teammate's database set up

```bash
# They clone repo
git clone https://github.com/camilojourney/camilomartinez-portfolio
cd camilomartinez-portfolio/backend

# Install dependencies
poetry install

# Apply all migrations from scratch
poetry run alembic upgrade head

# Done! Database is now identical to yours
```

### Scenario 4: Production Hotfix

**Problem:** Migration 0016 broke production

```bash
# 1. Rollback immediately
poetry run alembic downgrade -1

# 2. Fix the migration file locally
# Edit: backend/alembic/versions/0016_*.py

# 3. Test on staging
poetry run alembic upgrade head

# 4. Deploy to production
git push origin main
# CI/CD applies migration automatically
```

### Scenario 5: Data Migration

**Requirement:** Rename column from `workout_type` to `sport_name`

```python
# 1. Create migration
poetry run alembic revision -m "rename workout_type to sport_name"

# 2. Edit migration
def upgrade():
    # Copy data
    op.execute("""
        UPDATE whoop_workouts 
        SET sport_name = workout_type
    """)
    
    # Drop old column
    op.drop_column('whoop_workouts', 'workout_type')

def downgrade():
    # Restore old column
    op.add_column('whoop_workouts', 
                  sa.Column('workout_type', sa.String(100)))
    
    # Copy data back
    op.execute("""
        UPDATE whoop_workouts 
        SET workout_type = sport_name
    """)

# 3. Apply
poetry run alembic upgrade head
```

---

## 📚 Additional Resources

- **Official Alembic Docs:** https://alembic.sqlalchemy.org/
- **SQLAlchemy Documentation:** https://docs.sqlalchemy.org/
- **Our Backend README:** `backend/README.md`
- **Database Schema:** `docs/data/SCHEMA.md`

---

## 🎓 Quick Quiz - Test Your Knowledge

1. **What command creates a new migration?**
   - Answer: `alembic revision -m "description"` or `alembic revision --autogenerate -m "description"`

2. **What does `upgrade()` do?**
   - Answer: Applies changes (adds tables, columns, etc.)

3. **What does `downgrade()` do?**
   - Answer: Undoes changes (rollback)

4. **Where is the current version stored?**
   - Answer: In the `alembic_version` table in your database

5. **How do you rollback one migration?**
   - Answer: `alembic downgrade -1`

6. **What does `--autogenerate` do?**
   - Answer: Compares SQLAlchemy models to database and generates migration automatically

7. **What is `down_revision`?**
   - Answer: Points to the previous migration in the chain

8. **When would you use `alembic stamp head`?**
   - Answer: When database is already correct but Alembic tracking is out of sync

---

*Last Updated: October 7, 2025*
