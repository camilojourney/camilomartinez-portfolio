# WHOOP API v2 Data Relationships

## Understanding the Data Model

The WHOOP API v2 exposes several types of data that have logical relationships to each other:

1. **Cycles**: Represents a full day in the WHOOP system (from wake to wake)
2. **Sleep**: Represents sleep sessions
3. **Recovery**: Represents recovery scores based on sleep quality
4. **Workouts**: Represents athletic activities

## The Intended Relationships

The intended data relationships in the WHOOP API v2 are:

```
Cycle (1) -----> (1) Sleep
   |               |
   |               |
   v               v
   +------> Recovery <-----+
   |                       |
   v                       v
Workouts                 User
```

Each cycle should have one sleep record, which generates one recovery score.

## The API Issue

The WHOOP API v2 has a critical issue: the `/cycle/{cycleId}/sleep` endpoint consistently returns 404 errors. This makes it impossible to directly fetch the sleep record associated with a cycle.

However, we can still establish these relationships indirectly using the recovery data.

## Our Solution: Using Recovery as a Bridge

Recovery records contain both `cycle_id` and `sleep_id` fields, allowing us to establish the relationship between cycles and sleep records. Our collection strategy:

1. Collect all cycles using `/v2/cycle`
2. Collect all sleep records using `/v2/activity/sleep`
3. Collect all recovery records using `/v2/recovery`
4. Use the recovery records to update the `cycle_id` in sleep records

```typescript
// Example from our implementation
async updateSleepCycleRelationships(recoveries: WhoopRecovery[]): Promise<void> {
    // For each recovery record...
    for (const data of updateData) {
        // Update the cycle_id in the corresponding sleep record
        await sql`
            UPDATE whoop_sleep
            SET cycle_id = ${data.cycle_id}
            WHERE id = ${data.sleep_id}
            AND (cycle_id IS NULL OR cycle_id != ${data.cycle_id});
        `;
    }
}
```

## Database Schema Implications

Our database schema reflects these relationships:

```sql
CREATE TABLE whoop_cycles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    -- other fields...
);

CREATE TABLE whoop_sleep (
    id UUID PRIMARY KEY,
    cycle_id INTEGER REFERENCES whoop_cycles(id), -- Note: Nullable
    user_id INTEGER NOT NULL,
    -- other fields...
);

CREATE TABLE whoop_recovery (
    cycle_id INTEGER PRIMARY KEY REFERENCES whoop_cycles(id),
    sleep_id UUID REFERENCES whoop_sleep(id), -- Note: Nullable
    user_id INTEGER NOT NULL,
    -- other fields...
);
```

The foreign key constraints are nullable to handle cases where we can't establish these relationships.

## Conclusion

While the WHOOP API v2 has some endpoint issues, we can still establish the intended data relationships using the recovery data as a bridge. This allows us to maintain data integrity and provide a complete picture of a user's WHOOP data.
