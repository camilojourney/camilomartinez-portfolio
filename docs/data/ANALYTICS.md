# 📈 Analytics Metrics & Models

> **Status:** Stable · **Scope:** KPI Definitions, Calculations, Dashboards · **Last Updated:** October 2, 2025  
> **Owner:** Data Platform Guild · **Reviewer:** Analytics Guild

---

## TL;DR
- This catalog defines every metric powering dashboards and AI narratives, including formulas, dimensions, and caveats.
- Each metric maps to a source view/table and includes visualization and alert thresholds.
- Use this doc to ensure consistent storytelling across frontend, AI responses, and stakeholders.

---

## Table of Contents
- [🎯 KPI Overview](#-kpi-overview)
- [🧠 Recovery & Readiness](#-recovery--readiness)
- [🏃 Performance & Training Load](#-performance--training-load)
- [💤 Sleep & Regeneration](#-sleep--regeneration)
- [⚖️ Balance & Consistency](#️-balance--consistency)
- [🧮 Calculated Fields](#-calculated-fields)
- [🔔 Alerts & Thresholds](#-alerts--thresholds)
- [🔗 References](#-references)

---

## 🎯 KPI Overview

| Metric | Description | Source | Used In |
|--------|-------------|--------|---------|
| `recovery_score` | WHOOP % readiness score | `daily_fitness_snapshot.recovery_score` | Dashboards, AI summaries |
| `strain_score` | WHOOP strain (0-21) | `daily_fitness_snapshot.strain` | Training load analysis |
| `sleep_efficiency` | Sleep efficiency % | `daily_fitness_snapshot.sleep_efficiency_percentage` | Sleep tab, AI insights |
| `total_distance_miles` | Running distance per day | `daily_fitness_snapshot.total_distance_miles` | Run charts |
| `avg_pace_min_per_mile` | Pace in mm:ss | `run_performance_details` | Performance comparisons |
| `hrv_rmssd_ms` | HRV ms | `whoop_recovery.hrv_rmssd_milli` | Recovery trends |
| `hours_slept` | Sleep duration hours | `daily_fitness_snapshot.hours_slept` | Sleep charts |

---

## 🧠 Recovery & Readiness

### Recovery Score (Daily)
```
recovery_score = whoop_recovery.recovery_score
```
- **Context**: 0-100%; >85 optimal, 66-85 moderate, <65 low.
- **Visualization**: Gauge + 7-day trend line.
- **Notes**: AI responses highlight significant deviations (>10% vs baseline).

### HRV RMSSD (ms)
```
hrv_rmssd_ms = whoop_recovery.hrv_rmssd_milli / 1000
```
- **Usage**: AI uses HRV as early indicator of fatigue.
- **Alert**: Drop > 15% vs rolling average triggers “recovery watch” insight.

---

## 🏃 Performance & Training Load

### Daily Strain
```
strain_score = whoop_strain.strain
```
- Binned into `low` (<8), `moderate` (8-14), `high` (>14).

### Training Load Ratio (TLR)
```
acute_load = SUM(strain_score) last 7 days
chronic_load = AVG(strain_score) last 28 days
training_load_ratio = acute_load / (chronic_load * 7)
```
- **Interpretation**: TLR between 0.8-1.3 ideal; >1.5 risk.
- Stored in `run_performance_details.training_load_ratio` for each day.

### Running Pace
- Stored as `avg_pace_ms` but exposed as `avg_pace_min_per_mile` after conversion.
- AI and frontend share helper `lib/utils/formatPace.ts` for consistency.

---

## 💤 Sleep & Regeneration

### Total Sleep Hours
```
hours_slept = whoop_sleep.total_sleep_time_milli / (1000 * 60 * 60)
```

### Sleep Consistency
- Provided by WHOOP; normalized to 0-100%.
- Displayed with 7-day rolling average.

### Sleep Debt
```
sleep_debt_hours = (baseline_need - actual_sleep) aggregated weekly
```
- Derived in analytics mart `sleep_weekly_metrics`.

---

## ⚖️ Balance & Consistency

### Recovery-Strain Delta
```
delta = recovery_score - (strain_score * 3)
```
- Highlights mismatch between exertion and readiness.

### Run Consistency Index
```
consistency = runs_this_week / runs_last_four_weeks_avg
```
- Used to detect training adherence.

---

## 🧮 Calculated Fields

| Field | Formula | Location |
|-------|---------|----------|
| `hr_zone_percentages` | `zone_minutes / duration_minutes` | `run_performance_details` |
| `strain_density` | `strain / duration_hours` | `boxing_performance_details`, `weightlifting_performance_details` |
| `max_vs_avg_hr_delta` | `max_hr - avg_hr` | `run_performance_details` |
| `recovery_trend_zscore` | Z-score of 7-day average vs 60-day baseline | `recovery_trends` |

All calculations documented in `dbt` roadmap for reproducibility.

---

## 🔔 Alerts & Thresholds

| Alert | Condition | Action |
|-------|-----------|--------|
| **Recovery Watch** | Recovery score <65 for 3 days | AI suggests active recovery plan |
| **Overtraining Risk** | TLR >1.5 for 2 consecutive days | Notification + strain reduction tips |
| **Sleep Warning** | Sleep efficiency <80% for 5 days | Suggests sleep hygiene interventions |
| **Breakthrough** | Run pace improved >5% vs baseline | Celebrate insight, highlight training plan |

Alerts surfaced in dashboards and AI responses; metadata stored in `analytics_alerts` table.

---

## 🔗 References
- `docs/data/SCHEMA.md` – Table/column definitions for metrics.
- `docs/frontend/COMPONENTS.md` – Visualization components using these metrics.
- `docs/ai/RAG_SYSTEM.md` – AI pipeline referencing metrics in answers.
- `docs/data/DATA_QUALITY.md` – Validation thresholds per metric.

---

*Last Updated: October 2, 2025*
