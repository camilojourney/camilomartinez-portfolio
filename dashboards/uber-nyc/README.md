# Uber NYC Spring 2025 Dashboard — Group 6

Plotly Dash app answering: *How did Uber's stock, NYC trip activity, and NYC weather change during April 1 – May 31, 2025?*

Team: Afiya Afnin Anika · Daniel Hennessy · Juan Camilo Martinez · Ryan Ram

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Opens at http://localhost:8050.

The `data/` folder ships with pre-aggregated CSVs so the app runs immediately — no downloads required.

## Data sources

- **NYC TLC For-Hire Vehicle trips**: [nyc.gov/site/tlc/about/tlc-trip-record-data.page](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page) — Apr + May 2025 FHVHV parquets. Uber = `HV0003`, Lyft = `HV0005`.
- **NOAA daily weather**: Central Park station `USW00094728` via [ncei.noaa.gov/cdo-web](https://www.ncei.noaa.gov/cdo-web/) — TMAX, TMIN, PRCP.
- **Stock prices**: daily closes from Polygon.io daily-grouped CSVs (UBER, LYFT, DASH, ABNB, BKNG, EXPE, XLY).
