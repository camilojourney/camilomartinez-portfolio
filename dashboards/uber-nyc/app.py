"""
Uber NYC Spring 2025 Dashboard — Group 6

Plotly Dash app. Reads three small CSVs from ./data/ and serves a single-page
dashboard with a date-range slider, comparator checkboxes, 5 KPI cards,
and 5 coordinated charts. All views update via Dash callbacks.

Run:  python app.py   →  http://localhost:8050
"""

from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from dash import Dash, Input, Output, State, dcc, html

HERE = Path(__file__).parent
DATA = HERE / "data"

# ── Theme ─────────────────────────────────────────────────────────────────────
THEMES = {
    "dark": {
        "BG": "#0f0f1a",
        "PANEL": "#1a1a2e",
        "TEXT": "#e2e8f0",
        "MUTED": "#94a3b8",
        "GRID": "#2a2a3e",
    },
    "light": {
        "BG": "#ffffff",
        "PANEL": "#f8fafc",
        "TEXT": "#0f172a",
        "MUTED": "#64748b",
        "GRID": "#e2e8f0",
    },
}
UBER_GREEN = "#22c55e"
LYFT_PINK = "#ec4899"
TAXI_YELLOW = "#eab308"
TEMP_ORANGE = "#fb923c"
RAIN_BLUE = "#38bdf8"
POS_GREEN = "#22c55e"
NEG_RED = "#ef4444"
TICKER_COLORS = {
    "UBER": UBER_GREEN,
    "LYFT": LYFT_PINK,
    "TAXI": TAXI_YELLOW,
    "DASH": NEG_RED,
    "ABNB": "#fb923c",
    "BKNG": RAIN_BLUE,
    "EXPE": "#c4b5fd",
    "XLY":  "#a78bfa",
    "COMBINED": "#a78bfa",
}


def get_theme(mode: str | None) -> dict:
    return THEMES.get(mode or "dark", THEMES["dark"])

# ── Data load ─────────────────────────────────────────────────────────────────
trips = pd.read_csv(DATA / "trips_daily.csv", parse_dates=["date"])
weather = pd.read_csv(DATA / "weather_nyc.csv", parse_dates=["date"])
stocks = pd.read_csv(DATA / "stocks_panel.csv", parse_dates=["date"])

DATE_MIN = min(trips["date"].min(), weather["date"].min(), stocks["date"].min())
DATE_MAX = max(trips["date"].max(), weather["date"].max(), stocks["date"].max())
ALL_DATES = pd.date_range(DATE_MIN, DATE_MAX, freq="D")
DATE_INDEX = list(ALL_DATES)
N_DAYS = len(DATE_INDEX)

DOW_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# slider marks: first of April, mid-April, first of May, mid-May, end
def _mark(label: str) -> dict:
    return {"label": label, "style": {"color": "var(--muted-color)", "fontSize": 11}}

MARKS = {}
for i, d in enumerate(DATE_INDEX):
    if d.day == 1 or d.day == 15:
        MARKS[i] = _mark(d.strftime("%b %d"))
MARKS[0] = _mark(DATE_INDEX[0].strftime("%b %d"))
MARKS[N_DAYS - 1] = _mark(DATE_INDEX[-1].strftime("%b %d"))


# ── Helpers ───────────────────────────────────────────────────────────────────
def sign(v: float, unit: str = "", digits: int = 1) -> str:
    fmt = f"{{:+.{digits}f}}{unit}"
    return fmt.format(v)


def filter_range(df: pd.DataFrame, lo: int, hi: int) -> pd.DataFrame:
    lo_date = DATE_INDEX[lo]
    hi_date = DATE_INDEX[hi]
    return df[(df["date"] >= lo_date) & (df["date"] <= hi_date)].copy()


def _chap_style() -> dict:
    return {
        "color": "var(--text-color)",
        "fontSize": 15,
        "fontWeight": 600,
        "marginTop": 22,
        "marginBottom": 8,
        "borderLeft": f"3px solid #8b5cf6",
        "paddingLeft": 10,
    }


def _caption_style() -> dict:
    return {
        "background": "#14142b",
        "borderLeft": f"3px solid {UBER_GREEN}",
        "padding": "10px 14px",
        "color": "var(--text-color)",
        "fontSize": 13,
        "lineHeight": "1.5",
        "borderRadius": 6,
        "marginTop": 8,
        "marginBottom": 6,
    }


def base_layout(theme: dict, title: str = "", height: int = 320) -> dict:
    return dict(
        title=dict(text=title, font=dict(color=theme["TEXT"], size=14), x=0.02),
        paper_bgcolor=theme["PANEL"],
        plot_bgcolor=theme["PANEL"],
        font=dict(color=theme["TEXT"], family="Inter, system-ui, -apple-system, sans-serif"),
        height=height,
        margin=dict(l=55, r=55, t=45, b=40),
        xaxis=dict(gridcolor=theme["GRID"], zeroline=False, color=theme["MUTED"]),
        yaxis=dict(gridcolor=theme["GRID"], zeroline=False, color=theme["MUTED"]),
        legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color=theme["TEXT"], size=10)),
    )


def root_style(theme: dict) -> dict:
    return {
        "--bg-color": theme["BG"],
        "--panel-color": theme["PANEL"],
        "--text-color": theme["TEXT"],
        "--muted-color": theme["MUTED"],
        "--grid-color": theme["GRID"],
        "background": "var(--bg-color)",
        "color": "var(--text-color)",
        "minHeight": "100vh",
        "padding": "20px 26px",
        "fontFamily": "Inter, system-ui, -apple-system, sans-serif",
    }


# ── Layout ────────────────────────────────────────────────────────────────────
app = Dash(__name__, title="Uber NYC · Spring 2025")
server = app.server  # for gunicorn deploy


def kpi_card(card_id: str, label: str, sub: str = "") -> html.Div:
    return html.Div(
        [
            html.Div(label, className="kpi-label", style={"color": "var(--muted-color)", "fontSize": 12}),
            html.Div(id=card_id, className="kpi-value", style={"fontSize": 28, "fontWeight": 700, "color": "var(--text-color)"}),
            html.Div(sub, className="kpi-sub", style={"color": "var(--muted-color)", "fontSize": 11}),
        ],
        style={
            "background": "var(--panel-color)",
            "padding": "14px 18px",
            "borderRadius": 10,
            "flex": 1,
            "minWidth": 0,
        },
    )


def graph_panel(graph_id: str, flex: str = "1") -> html.Div:
    return html.Div(
        dcc.Graph(id=graph_id, config={"displayModeBar": False}),
        style={
            "background": "var(--panel-color)",
            "borderRadius": 10,
            "padding": 8,
            "flex": flex,
            "minWidth": 0,
        },
    )


app.layout = html.Div(
    [
        dcc.Store(id="theme-store", data="dark"),
        # Header
        html.Div(
            [
                html.Div(
                    [
                        html.H1("Uber NYC · Spring 2025 Dashboard",
                                style={"margin": 0, "color": "var(--text-color)", "fontSize": 22, "fontWeight": 700}),
                        html.Div(
                            "How did Uber's stock, NYC trip demand, and weather align — Apr 1 to May 31, 2025?",
                            style={"color": "var(--muted-color)", "fontSize": 13, "marginTop": 4},
                        ),
                    ],
                    style={"flex": 3},
                ),
                html.Div(
                    [
                        html.Div(id="range-readout", style={"color": "var(--text-color)", "fontSize": 13}),
                        html.Button(
                            "Theme: Dark",
                            id="theme-toggle",
                            n_clicks=0,
                            style={
                                "background": "var(--panel-color)",
                                "border": "1px solid var(--grid-color)",
                                "borderRadius": 999,
                                "color": "var(--text-color)",
                                "cursor": "pointer",
                                "fontSize": 12,
                                "fontWeight": 600,
                                "padding": "6px 12px",
                            },
                        ),
                    ],
                    style={
                        "display": "flex",
                        "alignItems": "center",
                        "justifyContent": "flex-end",
                        "gap": 10,
                        "flex": 1,
                    },
                ),
            ],
            style={"display": "flex", "alignItems": "center", "marginBottom": 16},
        ),

        # Controls: slider + comparators + trend mode
        html.Div(
            [
                html.Div(
                    [
                        html.Div("Date range (brushes all charts):",
                                 style={"color": "var(--muted-color)", "fontSize": 12, "marginBottom": 6}),
                        dcc.RangeSlider(
                            id="date-slider",
                            min=0,
                            max=N_DAYS - 1,
                            value=[0, N_DAYS - 1],
                            marks=MARKS,
                            step=1,
                            tooltip={"placement": "bottom"},
                            allowCross=False,
                        ),
                    ],
                    style={"flex": 3, "paddingRight": 24},
                ),
                html.Div(
                    [
                        html.Div("Compare UBER vs:", style={"color": "var(--muted-color)", "fontSize": 12, "marginBottom": 8}),
                        dcc.Checklist(
                            id="comparators",
                            options=[{"label": t, "value": t} for t in ["LYFT", "XLY"]],
                            value=["LYFT", "XLY"],
                            inline=True,
                            inputStyle={"marginRight": 6, "width": 14, "height": 14, "accentColor": "#8b5cf6"},
                            labelStyle={"marginRight": 16, "display": "inline-flex", "alignItems": "center", "whiteSpace": "nowrap", "color": "var(--text-color)"},
                            style={"color": "var(--text-color)", "fontSize": 13, "whiteSpace": "nowrap"},
                        ),
                    ],
                    style={"flex": 3, "minWidth": 0},
                ),
                html.Div(
                    [
                        html.Div("Stock mode:", style={"color": "var(--muted-color)", "fontSize": 12, "marginBottom": 8}),
                        dcc.RadioItems(
                            id="stock-mode",
                            options=[
                                {"label": "Normalised (start=100)", "value": "norm"},
                                {"label": "Absolute $", "value": "abs"},
                                {"label": "% from start", "value": "pct"},
                            ],
                            value="norm",
                            inline=True,
                            inputStyle={"marginRight": 6, "width": 14, "height": 14, "accentColor": "#8b5cf6"},
                            labelStyle={"marginRight": 16, "display": "inline-flex", "alignItems": "center", "whiteSpace": "nowrap", "color": "var(--text-color)"},
                            style={"color": "var(--text-color)", "fontSize": 13},
                        ),
                    ],
                    style={"flex": 3, "minWidth": 0},
                ),
            ],
            style={
                "background": "var(--panel-color)",
                "padding": "14px 18px",
                "borderRadius": 10,
                "display": "flex",
                "alignItems": "flex-end",
                "marginBottom": 14,
            },
        ),

        # KPI row
        html.Div(
            [
                kpi_card("kpi-uber-trips", "Uber Trips in Range", "HV0003 · NYC TLC"),
                kpi_card("kpi-lyft-trips", "Lyft Trips in Range", "HV0005 · NYC TLC"),
                kpi_card("kpi-taxi-trips", "Taxi Trips in Range", "Yellow + Green · NYC TLC"),
                kpi_card("kpi-uber-return", "UBER Stock Return", ""),
                kpi_card("kpi-avg-high", "Avg High Temp (°F)", "Central Park"),
                kpi_card("kpi-rainy", "Rainy Days", "PRCP > 0.1 in"),
            ],
            style={"display": "flex", "gap": 10, "marginBottom": 14},
        ),

        # Row A: stock + weather
        html.Div(
            [
                graph_panel("chart-stocks", flex="3"),
                graph_panel("chart-weather", flex="2"),
            ],
            style={"display": "flex", "gap": 10, "marginBottom": 14},
        ),

        # Row B: trips vs temp + DoW + scatter
        html.Div(
            [
                graph_panel("chart-trips-temp", flex="2"),
                graph_panel("chart-dow", flex="1"),
                graph_panel("chart-scatter", flex="2"),
            ],
            style={"display": "flex", "gap": 10, "marginBottom": 14},
        ),

        html.Hr(style={"border": "none", "borderTop": "1px solid var(--grid-color)", "margin": "24px 0 10px 0"}),

        # ── Chapters 1 & 2: shared service toggle, side-by-side charts ─────────
        html.Div("① Does rain or temperature affect trips?", style=_chap_style()),
        html.Div(
            [
                html.Label("Service:", style={"color": "var(--muted-color)", "fontSize": 12, "marginRight": 10, "alignSelf": "center"}),
                dcc.RadioItems(
                    id="service-pick",
                    options=[{"label": t, "value": t} for t in ["UBER", "LYFT", "TAXI", "Combined", "All"]],
                    value="UBER",
                    inline=True,
                    inputStyle={"marginRight": 6, "width": 14, "height": 14, "accentColor": "#8b5cf6"},
                    labelStyle={"marginRight": 18, "display": "inline-flex", "alignItems": "center", "color": "var(--text-color)"},
                    style={"display": "inline-block", "color": "var(--text-color)", "fontSize": 13},
                ),
            ],
            style={"display": "flex", "alignItems": "center", "marginBottom": 10},
        ),
        html.Div(
            [
                html.Div(graph_panel("chart-per-group-rain"), style={"flex": 3}),
                html.Div(graph_panel("chart-temp-trips"), style={"flex": 2}),
            ],
            style={"display": "flex", "gap": 10},
        ),
        # Footer: team names + Baruch logo
        html.Div(
            [
                html.Span(
                    "Afiya Afnin Anika  ·  Daniel Hennessy  ·  Juan Camilo Martinez  ·  Ryan Ram",
                    style={"color": "var(--text-color)", "fontSize": 13, "fontWeight": 500},
                ),
                html.Div(
                    html.Img(
                        src="/assets/baruch-logo-print@2x.png",
                        style={"height": 36, "display": "block"},
                    ),
                    style={
                        "background": "#ffffff",
                        "padding": "6px 10px",
                        "borderRadius": 8,
                        "marginLeft": "auto",
                        "display": "flex",
                        "alignItems": "center",
                    },
                ),
            ],
            style={
                "background": "var(--panel-color)",
                "padding": "12px 18px",
                "borderRadius": 10,
                "display": "flex",
                "alignItems": "center",
            },
        ),
    ],
    id="app-root",
    style=root_style(get_theme("dark")),
)


# ── Callbacks ─────────────────────────────────────────────────────────────────
@app.callback(
    Output("range-readout", "children"),
    Input("date-slider", "value"),
)
def update_readout(rng):
    lo, hi = rng
    return f"{DATE_INDEX[lo].strftime('%b %d')}  →  {DATE_INDEX[hi].strftime('%b %d, %Y')}"


@app.callback(
    Output("app-root", "style"),
    Output("theme-toggle", "children"),
    Input("theme-store", "data"),
)
def apply_theme(mode):
    theme_mode = mode if mode in THEMES else "dark"
    return root_style(get_theme(theme_mode)), f"Theme: {theme_mode.title()}"


@app.callback(
    Output("theme-store", "data"),
    Input("theme-toggle", "n_clicks"),
    State("theme-store", "data"),
)
def toggle_theme(n_clicks, current_mode):
    if not n_clicks:
        return current_mode or "dark"
    return "light" if (current_mode or "dark") == "dark" else "dark"


@app.callback(
    Output("kpi-uber-trips", "children"),
    Output("kpi-lyft-trips", "children"),
    Output("kpi-taxi-trips", "children"),
    Output("kpi-uber-return", "children"),
    Output("kpi-uber-return", "style"),
    Output("kpi-avg-high", "children"),
    Output("kpi-rainy", "children"),
    Input("date-slider", "value"),
    Input("theme-store", "data"),
)
def update_kpis(rng, theme_mode):
    theme = get_theme(theme_mode)
    lo, hi = rng
    t = filter_range(trips, lo, hi)
    w = filter_range(weather, lo, hi)
    s = stocks[stocks["ticker"] == "UBER"]
    s = filter_range(s, lo, hi).sort_values("date")

    uber = f"{int(t['uber_trips'].sum()):,}"
    lyft = f"{int(t['lyft_trips'].sum()):,}"
    taxi = f"{int(t['taxi_trips'].sum()):,}" if "taxi_trips" in t.columns else "—"

    if len(s) >= 2:
        ret = (s["close"].iloc[-1] / s["close"].iloc[0] - 1) * 100
        ret_txt = sign(ret, "%")
        ret_colour = UBER_GREEN if ret >= 0 else NEG_RED
    else:
        ret_txt, ret_colour = "—", theme["TEXT"]

    avg_high = f"{w['tmax_f'].mean():.1f}°" if len(w) else "—"
    rainy = f"{int((w['prcp_in'] > 0.1).sum())}" if len(w) else "—"

    ret_style = {"fontSize": 28, "fontWeight": 700, "color": ret_colour}
    return uber, lyft, taxi, ret_txt, ret_style, avg_high, rainy


@app.callback(
    Output("chart-stocks", "figure"),
    Input("date-slider", "value"),
    Input("comparators", "value"),
    Input("stock-mode", "value"),
    Input("theme-store", "data"),
)
def update_stocks(rng, comparators, mode, theme_mode):
    theme = get_theme(theme_mode)
    lo, hi = rng
    tickers = ["UBER"] + list(comparators or [])

    # Pre-compute each ticker's performance so we can sort the legend by winner → loser.
    y_label = {"norm": "Indexed (start = 100)",
               "pct":  "% change from start",
               "abs":  "Close ($)"}.get(mode, "Close ($)")
    series = []
    for t in tickers:
        s = filter_range(stocks[stocks["ticker"] == t], lo, hi).sort_values("date")
        if s.empty:
            continue
        base = s["close"].iloc[0]
        last = s["close"].iloc[-1]
        change_pct = (last / base - 1) * 100
        if mode == "norm":
            y = s["close"] / base * 100
        elif mode == "pct":
            y = (s["close"] / base - 1) * 100
        else:
            y = s["close"]
        series.append({"t": t, "s": s, "y": y, "change_pct": change_pct, "last_val": y.iloc[-1]})

    # Sort by change_pct descending so the best performer is first in the legend.
    series.sort(key=lambda r: r["change_pct"], reverse=True)

    fig = go.Figure()

    for row in series:
        t = row["t"]
        color = TICKER_COLORS.get(t, theme["MUTED"])
        dash_style = "solid" if t == "UBER" else "dot"
        width = 2.6 if t == "UBER" else 1.7

        label_fmt = f"{row['change_pct']:+.1f}%"

        fig.add_trace(
            go.Scatter(
                x=row["s"]["date"], y=row["y"], mode="lines+markers", name=t,
                line=dict(color=color, width=width, dash=dash_style),
                marker=dict(size=4),
                hovertemplate=f"<b>{t}</b> %{{x|%b %d}}<br>%{{y:.2f}}  ({label_fmt} total)<extra></extra>",
            )
        )

        # End-of-line label
        fig.add_annotation(
            x=row["s"]["date"].iloc[-1],
            y=row["last_val"],
            text=f"<b>{t}</b> {label_fmt}",
            showarrow=False,
            xanchor="left",
            yanchor="middle",
            xshift=6,
            font=dict(color=color, size=11),
            bgcolor=theme["BG"],
            bordercolor=color,
            borderwidth=1,
            borderpad=3,
        )

    mode_label = {
        "norm": "Normalised — everyone starts at 100",
        "abs":  "Absolute price in dollars",
        "pct":  "% change since start of range",
    }[mode]

    layout = base_layout(
        theme,
        f"Stock Prices — {mode_label}",
        height=340,
    )
    layout["yaxis"]["title"] = dict(text=y_label, font=dict(color=theme["MUTED"], size=11))
    layout["yaxis"]["autorange"] = True
    layout["xaxis"]["range"] = [
        DATE_INDEX[lo],
        DATE_INDEX[hi] + pd.Timedelta(days=5),  # room for end-labels
    ]
    layout["legend"] = dict(
        orientation="h", yanchor="top", y=1.14, xanchor="left", x=0,
        bgcolor="rgba(0,0,0,0)", font=dict(color=theme["TEXT"], size=11),
    )
    layout["margin"] = dict(l=55, r=95, t=80, b=40)
    layout["title"]["y"] = 0.97
    layout["title"]["yanchor"] = "top"
    layout["uirevision"] = f"stock-{mode}"
    fig.update_layout(**layout)

    # Zero / 100 baseline for easy "above = growing" read
    if mode == "pct":
        fig.add_hline(y=0, line=dict(color=theme["MUTED"], width=1, dash="solid"), opacity=0.5)
    elif mode == "norm":
        fig.add_hline(y=100, line=dict(color=theme["MUTED"], width=1, dash="solid"), opacity=0.5)

    return fig


@app.callback(
    Output("chart-weather", "figure"),
    Input("date-slider", "value"),
    Input("theme-store", "data"),
)
def update_weather(rng, theme_mode):
    theme = get_theme(theme_mode)
    lo, hi = rng
    w = filter_range(weather, lo, hi).sort_values("date")

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=w["date"], y=w["prcp_in"],
        name="Precip (in)", marker_color=RAIN_BLUE, opacity=0.55,
        yaxis="y2",
        hovertemplate="%{x|%b %d}<br>Precip: %{y:.2f} in<extra></extra>",
    ))
    fig.add_trace(go.Scatter(
        x=w["date"], y=w["tmax_f"], mode="lines+markers", name="High °F",
        line=dict(color=TEMP_ORANGE, width=2), marker=dict(size=5),
        hovertemplate="%{x|%b %d}<br>High: %{y:.0f}°F<extra></extra>",
    ))
    fig.add_trace(go.Scatter(
        x=w["date"], y=w["tmin_f"], mode="lines+markers", name="Low °F",
        line=dict(color="#fdba74", width=1.2, dash="dot"), marker=dict(size=4),
        fill="tonexty", fillcolor="rgba(251, 146, 60, 0.12)",
        hovertemplate="%{x|%b %d}<br>Low: %{y:.0f}°F<extra></extra>",
    ))

    layout = base_layout(theme, "Daily Weather — NYC (Central Park)", height=340)
    layout["yaxis"]["title"] = dict(text="Temperature (°F)", font=dict(color=theme["MUTED"], size=11))
    layout["yaxis2"] = dict(
        title=dict(text="Precip (in)", font=dict(color=theme["MUTED"], size=11)),
        overlaying="y", side="right", gridcolor="rgba(0,0,0,0)", color=theme["MUTED"], showgrid=False,
    )
    layout["legend"] = dict(
        orientation="h", yanchor="top", y=1.14, xanchor="left", x=0,
        bgcolor="rgba(0,0,0,0)", font=dict(color=theme["TEXT"], size=11),
    )
    layout["margin"] = dict(l=55, r=55, t=80, b=40)
    layout["title"]["y"] = 0.97
    layout["title"]["yanchor"] = "top"
    fig.update_layout(**layout)
    return fig


@app.callback(
    Output("chart-trips-temp", "figure"),
    Input("date-slider", "value"),
    Input("theme-store", "data"),
)
def update_trips_temp(rng, theme_mode):
    theme = get_theme(theme_mode)
    lo, hi = rng
    t = filter_range(trips, lo, hi).sort_values("date")
    w = filter_range(weather, lo, hi).sort_values("date")
    merged = t.merge(w, on="date", how="left")

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=merged["date"], y=merged["uber_trips"], name="Uber",
        marker_color=UBER_GREEN, opacity=0.7,
        hovertemplate="%{x|%b %d}<br>Uber: %{y:,}<extra></extra>",
    ))
    fig.add_trace(go.Bar(
        x=merged["date"], y=merged["lyft_trips"], name="Lyft",
        marker_color=LYFT_PINK, opacity=0.7,
        hovertemplate="%{x|%b %d}<br>Lyft: %{y:,}<extra></extra>",
    ))
    if "taxi_trips" in merged.columns:
        fig.add_trace(go.Bar(
            x=merged["date"], y=merged["taxi_trips"], name="Taxi",
            marker_color=TAXI_YELLOW, opacity=0.7,
            hovertemplate="%{x|%b %d}<br>Taxi: %{y:,}<extra></extra>",
        ))

    # Weekend shading — very subtle
    for d in merged["date"]:
        if d.dayofweek >= 5:
            fig.add_vrect(
                x0=d - pd.Timedelta(hours=12), x1=d + pd.Timedelta(hours=12),
                fillcolor="rgba(15,23,42,0.06)" if theme_mode == "light" else "rgba(255,255,255,0.04)",
                line_width=0, layer="below",
            )

    # Rainy days — umbrella marker above each bar stack, sized by rainfall
    merged["total_trips"] = (
        merged["uber_trips"].fillna(0)
        + merged["lyft_trips"].fillna(0)
        + (merged["taxi_trips"].fillna(0) if "taxi_trips" in merged.columns else 0)
    )
    rain_days = merged[merged["prcp_in"] > 0.1].copy()
    if not rain_days.empty:
        # Symbol size scales with rainfall intensity (drizzle → heavy)
        rain_days["marker_size"] = rain_days["prcp_in"].clip(0.1, 1.5).apply(
            lambda x: 14 if x < 0.1 else 16 if x < 0.5 else 20
        )
        fig.add_trace(go.Scatter(
            x=rain_days["date"],
            y=rain_days["total_trips"] * 1.05,
            mode="text",
            text="☔",
            textfont=dict(size=16, color=RAIN_BLUE),
            name="Rain day",
            customdata=rain_days["prcp_in"],
            hovertemplate="%{x|%b %d}<br>Rain: %{customdata:.2f} in<extra></extra>",
            showlegend=True,
        ))

    # Temperature line — bright orange on top of everything for maximum contrast
    fig.add_trace(go.Scatter(
        x=merged["date"], y=merged["tmax_f"], name="High °F",
        mode="lines+markers",
        line=dict(color=TEMP_ORANGE, width=3.2),
        marker=dict(size=4, color=TEMP_ORANGE, line=dict(color=theme["BG"], width=1)),
        yaxis="y2",
        hovertemplate="%{x|%b %d}<br>High: %{y:.0f}°F<extra></extra>",
    ))

    layout = base_layout(theme, "Daily Trips & Temperature — ☔ = rain day", height=400)
    layout["title"]["x"] = 0.5
    layout["title"]["xanchor"] = "center"
    layout["title"]["y"] = 0.97
    layout["title"]["yanchor"] = "top"
    layout["yaxis"]["title"] = dict(text="Daily Trips", font=dict(color=theme["MUTED"], size=11))
    if "total_trips" in merged.columns and merged["total_trips"].max() > 0:
        layout["yaxis"]["range"] = [0, float(merged["total_trips"].max()) * 1.18]
    layout["yaxis2"] = dict(
        title=dict(text="Max Temp (°F)", font=dict(color=theme["MUTED"], size=11)),
        overlaying="y", side="right", gridcolor="rgba(0,0,0,0)", color=theme["MUTED"], showgrid=False,
    )
    layout["barmode"] = "stack"
    layout["margin"] = dict(l=65, r=65, t=90, b=50)
    layout["legend"] = dict(
        orientation="h", yanchor="top", y=1.12, xanchor="center", x=0.5,
        bgcolor="rgba(0,0,0,0)", font=dict(color=theme["TEXT"], size=11),
    )
    fig.update_layout(**layout)
    return fig


@app.callback(
    Output("chart-dow", "figure"),
    Input("date-slider", "value"),
    Input("theme-store", "data"),
)
def update_dow(rng, theme_mode):
    theme = get_theme(theme_mode)
    lo, hi = rng
    t = filter_range(trips, lo, hi)
    if t.empty:
        return go.Figure(layout=base_layout(theme, "Avg Trips by Day of Week", height=340))
    cols = [c for c in ["uber_trips", "lyft_trips", "taxi_trips"] if c in t.columns]
    agg = t.groupby("dow")[cols].mean().reindex(DOW_ORDER).reset_index()
    agg["dow_short"] = agg["dow"].str[:3]

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=agg["dow_short"], y=agg["uber_trips"], name="Uber", marker_color=UBER_GREEN,
        hovertemplate="%{x}<br>Uber avg: %{y:,.0f}<extra></extra>",
    ))
    fig.add_trace(go.Bar(
        x=agg["dow_short"], y=agg["lyft_trips"], name="Lyft", marker_color=LYFT_PINK,
        hovertemplate="%{x}<br>Lyft avg: %{y:,.0f}<extra></extra>",
    ))
    if "taxi_trips" in agg.columns:
        fig.add_trace(go.Bar(
            x=agg["dow_short"], y=agg["taxi_trips"], name="Taxi", marker_color=TAXI_YELLOW,
            hovertemplate="%{x}<br>Taxi avg: %{y:,.0f}<extra></extra>",
        ))

    layout = base_layout(theme, "Avg Trips by Day of Week", height=400)
    layout["title"]["x"] = 0.5
    layout["title"]["xanchor"] = "center"
    layout["title"]["y"] = 0.97
    layout["title"]["yanchor"] = "top"
    layout["yaxis"]["title"] = dict(text="Avg Daily Trips", font=dict(color=theme["MUTED"], size=11))
    layout["barmode"] = "group"
    layout["margin"] = dict(l=65, r=30, t=90, b=50)
    layout["legend"] = dict(
        orientation="h", yanchor="top", y=1.12, xanchor="center", x=0.5,
        bgcolor="rgba(0,0,0,0)", font=dict(color=theme["TEXT"], size=11),
    )
    fig.update_layout(**layout)
    return fig


@app.callback(
    Output("chart-scatter", "figure"),
    Input("date-slider", "value"),
    Input("theme-store", "data"),
)
def update_scatter(rng, theme_mode):
    theme = get_theme(theme_mode)
    lo, hi = rng
    t = filter_range(trips, lo, hi)
    u = filter_range(stocks[stocks["ticker"] == "UBER"], lo, hi)
    w = filter_range(weather, lo, hi)

    merged = (
        t[["date", "uber_trips"]]
        .merge(u[["date", "close"]], on="date", how="inner")
        .merge(w[["date", "tmax_f"]], on="date", how="left")
        .rename(columns={"close": "uber_close"})
        .dropna(subset=["uber_trips", "uber_close"])
    )

    fig = go.Figure()
    if merged.empty:
        fig.update_layout(**base_layout(theme, "UBER Stock vs Daily Trip Volume", height=340))
        return fig

    fig.add_trace(go.Scatter(
        x=merged["uber_trips"], y=merged["uber_close"], mode="markers",
        marker=dict(
            size=10, color=merged["tmax_f"], colorscale="RdYlGn",
            colorbar=dict(title=dict(text="Temp °F", font=dict(color=theme["MUTED"], size=10)), tickfont=dict(color=theme["MUTED"], size=9)),
            line=dict(color=theme["BG"], width=1),
        ),
        text=merged["date"].dt.strftime("%b %d"),
        hovertemplate="<b>%{text}</b><br>Trips: %{x:,}<br>UBER: $%{y:.2f}<extra></extra>",
        name="Trading day",
    ))

    # OLS trend line + r
    x_vals = merged["uber_trips"].to_numpy(dtype=float)
    y_vals = merged["uber_close"].to_numpy(dtype=float)
    if len(x_vals) >= 2:
        slope, intercept = np.polyfit(x_vals, y_vals, 1)
        x_line = np.array([x_vals.min(), x_vals.max()])
        y_line = slope * x_line + intercept
        r = float(np.corrcoef(x_vals, y_vals)[0, 1])
        fig.add_trace(go.Scatter(
            x=x_line, y=y_line, mode="lines", name=f"trend  r = {r:+.2f}",
            line=dict(color=theme["MUTED"], width=1.5, dash="dash"),
            hoverinfo="skip",
        ))

    layout = base_layout(theme, "UBER Stock vs Daily Uber Trips — colour = high temp", height=400)
    layout["title"]["x"] = 0.5
    layout["title"]["xanchor"] = "center"
    layout["title"]["y"] = 0.97
    layout["title"]["yanchor"] = "top"
    layout["xaxis"]["title"] = dict(text="Daily Uber Trips", font=dict(color=theme["MUTED"], size=11))
    layout["yaxis"]["title"] = dict(text="UBER Close ($)", font=dict(color=theme["MUTED"], size=11))
    layout["margin"] = dict(l=65, r=30, t=90, b=50)
    layout["legend"] = dict(
        orientation="h", yanchor="top", y=1.12, xanchor="center", x=0.5,
        bgcolor="rgba(0,0,0,0)", font=dict(color=theme["TEXT"], size=11),
    )
    fig.update_layout(**layout)
    return fig





# ── Chapter 1: do warmer days bring more trips? ──────────────────────────────
_TEMP_SERVICE_COLS = {"UBER": "uber_trips", "LYFT": "lyft_trips", "TAXI": "taxi_trips", "COMBINED": "total_trips"}
_TEMP_SERVICE_COLORS = {"UBER": UBER_GREEN, "LYFT": LYFT_PINK, "TAXI": TAXI_YELLOW, "COMBINED": "#a78bfa"}


@app.callback(
    Output("chart-temp-trips", "figure"),
    Input("date-slider", "value"),
    Input("service-pick", "value"),
    Input("theme-store", "data"),
)
def update_temp_trips(rng, service, theme_mode):
    theme = get_theme(theme_mode)
    service = service or "All"
    lo, hi = rng
    t = filter_range(trips, lo, hi)
    w = filter_range(weather, lo, hi)[["date", "tmax_f"]]
    m = t.merge(w, on="date", how="inner").dropna(subset=["tmax_f"])
    if m.empty:
        return go.Figure(layout=base_layout(theme, "Warmer days = more trips?", height=400))

    m["is_weekend"] = m["date"].dt.dayofweek >= 5
    m["total_trips"] = m["uber_trips"].fillna(0) + m["lyft_trips"].fillna(0) + (m["taxi_trips"].fillna(0) if "taxi_trips" in m.columns else 0)
    service = service or "UBER"
    services = list(k for k in _TEMP_SERVICE_COLS.keys() if k != "COMBINED") if service == "All" else (["COMBINED"] if service == "Combined" else [service])

    r_vals = {}
    n = len(services)
    if n > 1:
        fig = make_subplots(rows=1, cols=n,
                            shared_yaxes=False, horizontal_spacing=0.08)
    else:
        fig = go.Figure()

    for idx, svc in enumerate(services, start=1):
        col = _TEMP_SERVICE_COLS[svc]
        if col not in m.columns:
            continue
        y_data = m[col].fillna(0)
        color = _TEMP_SERVICE_COLORS[svc]
        r = float(np.corrcoef(m["tmax_f"], y_data)[0, 1])
        r_vals[svc] = r
        slope, intercept = np.polyfit(m["tmax_f"], y_data, 1)
        x_line = np.array([m["tmax_f"].min(), m["tmax_f"].max()])
        y_line = slope * x_line + intercept

        wd = m[~m["is_weekend"]]
        we = m[m["is_weekend"]]
        kwargs = dict(row=1, col=idx) if n > 1 else {}

        # dots — no legend, just hover
        fig.add_trace(go.Scatter(
            x=wd["tmax_f"], y=wd[col].fillna(0), mode="markers",
            name=f"{svc} weekday", showlegend=False,
            marker=dict(size=7, color=color, opacity=0.22, symbol="circle"),
            text=wd["date"].dt.strftime("%a %b %d"),
            hovertemplate=f"<b>%{{text}}</b><br>High: %{{x}}°F<br>{svc}: %{{y:,}}<extra></extra>",
        ), **kwargs)
        fig.add_trace(go.Scatter(
            x=we["tmax_f"], y=we[col].fillna(0), mode="markers",
            name=f"{svc} weekend", showlegend=False,
            marker=dict(size=8, color=color, opacity=0.22, symbol="diamond"),
            text=we["date"].dt.strftime("%a %b %d"),
            hovertemplate=f"<b>%{{text}}</b><br>High: %{{x}}°F<br>{svc} (wknd): %{{y:,}}<extra></extra>",
        ), **kwargs)
        # trend line — label at the right end via annotation instead of legend
        fig.add_trace(go.Scatter(
            x=x_line, y=y_line, mode="lines",
            name=f"{svc}", showlegend=True,
            line=dict(color=color, width=3),
            hoverinfo="skip",
        ), **kwargs)

    # shared layout settings
    common = dict(
        paper_bgcolor=theme["PANEL"], plot_bgcolor=theme["PANEL"],
        font=dict(color=theme["TEXT"], family="Inter, system-ui, sans-serif"),
        height=420,
        legend=dict(
            orientation="v", yanchor="top", y=0.98, xanchor="left", x=1.01,
            bgcolor="rgba(0,0,0,0)", font=dict(color=theme["TEXT"], size=12),
            title=dict(text="Trend", font=dict(color=theme["MUTED"], size=10)),
        ),
        uirevision=f"temp-{service}",
    )

    if n > 1:
        for i in range(1, n + 1):
            fig.update_xaxes(title_text="Max Temp (°F)", title_font=dict(color=theme["MUTED"], size=10),
                             tickfont=dict(color=theme["MUTED"]), gridcolor=theme["GRID"], row=1, col=i)
            fig.update_yaxes(title_text="Daily Trips" if i == 1 else "",
                             title_font=dict(color=theme["MUTED"], size=10),
                             tickfont=dict(color=theme["MUTED"]), gridcolor=theme["GRID"], row=1, col=i)
        title_txt = " · ".join(services) + " — daily trips by temperature"
        fig.update_layout(
            **common,
            title=dict(text=title_txt, font=dict(color=theme["TEXT"], size=14),
                       x=0.5, xanchor="center", y=0.97, yanchor="top"),
            margin=dict(l=55, r=90, t=60, b=50),
        )
    else:
        svc = services[0]
        layout = base_layout(
            theme,
            f"{svc} — daily trips by temperature   r = {r_vals.get(svc, 0):+.2f}",
            height=420,
        )
        layout["title"]["x"] = 0.5
        layout["title"]["xanchor"] = "center"
        layout["title"]["y"] = 0.97
        layout["title"]["yanchor"] = "top"
        layout["xaxis"]["title"] = dict(text="Max Temp (°F)", font=dict(color=theme["MUTED"], size=11))
        layout["yaxis"]["title"] = dict(text="Daily Trips", font=dict(color=theme["MUTED"], size=11))
        layout["margin"] = dict(l=55, r=20, t=60, b=50)
        layout["showlegend"] = False
        layout["uirevision"] = f"temp-{service}"
        fig.update_layout(**layout)

    return fig


# ── Chapter 2: rain response (UBER vs LYFT toggle) ──────────────────────────
_RAIN_BINS = [-0.001, 0.001, 0.1, 0.5, 100]
_RAIN_LABELS = ["Dry (0 in)", "Drizzle (<0.1 in)", "Rain (0.1–0.5 in)", "Heavy (>0.5 in)"]


def _rain_buckets(series: pd.Series) -> pd.Categorical:
    return pd.cut(series, bins=_RAIN_BINS, labels=_RAIN_LABELS)


def _rideshare_rain_series(rng, ticker: str):
    """Returns bucket aggregates for UBER or LYFT daily NYC trips across rain buckets."""
    lo, hi = rng
    w = filter_range(weather, lo, hi)[["date", "prcp_in"]]
    t = filter_range(trips, lo, hi).merge(w, on="date", how="inner")
    if t.empty:
        return None
    if ticker == "COMBINED":
        t["total_trips"] = t["uber_trips"].fillna(0) + t["lyft_trips"].fillna(0) + (t["taxi_trips"].fillna(0) if "taxi_trips" in t.columns else 0)
        col = "total_trips"
    else:
        col = "uber_trips" if ticker == "UBER" else ("lyft_trips" if ticker == "LYFT" else "taxi_trips")
    t["bucket"] = _rain_buckets(t["prcp_in"])
    agg = t.groupby("bucket", observed=True)[col].mean().reindex(_RAIN_LABELS)
    counts = t.groupby("bucket", observed=True).size().reindex(_RAIN_LABELS).fillna(0).astype(int)
    dry = float(agg.iloc[0]) if pd.notna(agg.iloc[0]) else float(agg.mean() or 0)
    lifts = ((agg / dry - 1) * 100) if dry else pd.Series([0] * len(agg), index=agg.index)
    return {"values": agg, "counts": counts, "lifts": lifts, "dry": dry}


def _rain_bar_labels_trips(values, lifts, counts, theme: dict, minimal: bool = False):
    """Trip-count bar label. Full: 467k / ▲ 7.4% / n=10.
    Minimal (used for All view): just the lift %."""
    out = []
    for v, lift, n, label in zip(values, lifts, counts, _RAIN_LABELS):
        if pd.isna(v):
            out.append("")
            continue
        is_dry = label.startswith("Dry")
        if minimal:
            if is_dry:
                out.append("")
            else:
                arrow = "▲" if lift > 0 else "▼" if lift < 0 else "●"
                color = POS_GREEN if lift > 0 else NEG_RED if lift < 0 else theme["TEXT"]
                out.append(
                    f"<span style='color:{color};font-size:18px;font-weight:700'>"
                    f"{arrow} {abs(lift):.1f}%</span>"
                )
            continue
        v_txt = f"{v/1000:,.0f}k"
        if is_dry:
            out.append(
                f"<b>{v_txt}</b><br>"
                f"<span style='color:{theme['MUTED']};font-size:10px'>normal day · n={int(n)}</span>"
            )
        else:
            arrow = "▲" if lift > 0 else "▼" if lift < 0 else "●"
            color = POS_GREEN if lift > 0 else NEG_RED if lift < 0 else theme["TEXT"]
            out.append(
                f"<b>{v_txt}</b><br>"
                f"<span style='color:{color};font-size:12px;font-weight:700'>{arrow} {abs(lift):.1f}%</span>"
                f"<br><span style='color:{theme['MUTED']};font-size:10px'>n={int(n)}</span>"
            )
    return out


@app.callback(
    Output("chart-per-group-rain", "figure"),
    Input("date-slider", "value"),
    Input("service-pick", "value"),
    Input("theme-store", "data"),
)
def update_per_group_rain(rng, pick, theme_mode):
    theme = get_theme(theme_mode)
    tickers = ["UBER", "LYFT", "TAXI"] if (pick or "UBER") == "All" else (["COMBINED"] if pick == "Combined" else [pick or "UBER"])

    results = []
    for tk in tickers:
        r = _rideshare_rain_series(rng, tk)
        if r is not None:
            results.append((tk, r))

    if not results:
        return go.Figure(layout=base_layout(theme, "No data in range", height=420))

    n_panels = len(results)
    title_tk = results[0][0] if n_panels == 1 else " · ".join(tk for tk, _ in results)
    fig = make_subplots(
        rows=1, cols=n_panels,
        horizontal_spacing=0.12,
    )

    is_all = (pick or "UBER") == "All"
    for col_idx, (tk, r) in enumerate(results, start=1):
        color = TICKER_COLORS.get(tk, UBER_GREEN)
        labels = _rain_bar_labels_trips(r["values"], r["lifts"], r["counts"], theme, minimal=is_all)
        fig.add_trace(
            go.Bar(
                x=_RAIN_LABELS, y=r["values"],
                marker_color=color,
                text=labels, textposition="outside",
                textfont=dict(size=11, color=theme["TEXT"]),
                cliponaxis=False,
                name=tk, showlegend=False,
                hovertemplate=(
                    f"<b>{tk}</b> · %{{x}}<br>"
                    "Trips: %{y:,.0f}<br>"
                    "%{customdata[0]:+.1f}% vs dry<br>"
                    "n = %{customdata[1]} days<extra></extra>"
                ),
                customdata=np.stack([r["lifts"].fillna(0).values,
                                     r["counts"].fillna(0).astype(int).values], axis=-1),
            ),
            row=1, col=col_idx,
        )
        ymax = float(r["values"].max()) * 1.35 if pd.notna(r["values"].max()) else 1
        fig.update_yaxes(range=[0, ymax], row=1, col=col_idx,
                         gridcolor=theme["GRID"], color=theme["MUTED"],
                         title=dict(text="Avg daily trips", font=dict(color=theme["MUTED"], size=10)))
        fig.update_xaxes(row=1, col=col_idx, color=theme["MUTED"], tickfont=dict(size=10))

    fig.update_layout(
        title=dict(
            text=f"{title_tk} — daily NYC trips by rain bucket",
            font=dict(color=theme["TEXT"], size=14),
            x=0.5, xanchor="center", y=0.97, yanchor="top",
        ),
        paper_bgcolor=theme["PANEL"], plot_bgcolor=theme["PANEL"],
        font=dict(color=theme["TEXT"], family="Inter, system-ui, -apple-system, sans-serif"),
        height=420,
        margin=dict(l=55, r=30, t=60, b=55),
        bargap=0.25,
        showlegend=False,
    )
    return fig


if __name__ == "__main__":
    app.run(debug=True, port=8050)
