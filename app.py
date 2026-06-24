"""KI-Kochassistent — Streamlit Web-App.

Schlägt auf Basis vorhandener Zutaten ein passendes Gericht vor und liefert
das vollständige Rezept. Nutzt das Anthropic Python SDK (claude-sonnet-4-6).
"""

import json

import streamlit as st
from anthropic import (
    Anthropic,
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    RateLimitError,
)

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """Du bist ein kreativer Kochassistent. Antworte IMMER auf Deutsch.
Schlage genau 1 passendes Gericht vor und liefere das vollständige Rezept.
Antworte NUR als gültiges JSON ohne Markdown-Backticks.

JSON-Struktur:
{
  "gericht": "Name",
  "schwierigkeit": "Einfach",
  "zubereitungszeit": "25 Minuten",
  "kalorien_gesamt": "ca. 840 kcal",
  "kalorien_portion": "ca. 420 kcal",
  "zutaten": [
    { "name": "Hähnchenbrust", "menge": "300 g", "vorhanden": true },
    { "name": "Olivenöl", "menge": "2 EL", "vorhanden": false }
  ],
  "schritte": [
    { "text": "Reis kochen.", "timer": "18 Min." },
    { "text": "Hähnchen anbraten.", "timer": null }
  ],
  "einkaufsliste": ["Olivenöl – 2 EL"],
  "tipp": "Optionaler Tipp"
}"""


# --------------------------------------------------------------------------- #
# Seiten-Konfiguration & Styling
# --------------------------------------------------------------------------- #
st.set_page_config(
    page_title="KI-Kochassistent",
    page_icon="🍳",
    layout="centered",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      /* Grundfarben (Trade Republic Style) */
      .stApp {
        background-color: #0a0a0a;
        color: #f5f5f5;
      }
      #MainMenu, footer, header { visibility: hidden; }
      .block-container { padding-top: 2.5rem; padding-bottom: 4rem; max-width: 820px; }

      h1, h2, h3, h4 { color: #ffffff; letter-spacing: -0.02em; }

      /* Eingabe-Karten */
      .stTextArea textarea,
      div[data-baseweb="select"] > div {
        background-color: #1a1a1a !important;
        color: #f5f5f5 !important;
        border: 1px solid #262626 !important;
        border-radius: 12px !important;
      }
      .stTextArea textarea:focus {
        border-color: #00b87a !important;
        box-shadow: 0 0 0 1px #00b87a !important;
      }

      label, .stMarkdown p { color: #b3b3b3 !important; }

      /* Primärer Button */
      .stButton > button {
        background-color: #00b87a;
        color: #0a0a0a;
        font-weight: 700;
        border: none;
        border-radius: 12px;
        padding: 0.7rem 1.4rem;
        width: 100%;
        transition: filter 0.15s ease;
      }
      .stButton > button:hover { filter: brightness(1.08); color: #0a0a0a; }
      .stButton > button:active { filter: brightness(0.95); }

      /* Stil-Toggle-Buttons (Pills) */
      div[data-testid="stButton"] button[kind="secondary"] {
        background-color: #1a1a1a;
        color: #b3b3b3;
        border: 1px solid #262626;
      }

      /* Metriken */
      div[data-testid="stMetric"] {
        background-color: #1a1a1a;
        border: 1px solid #262626;
        border-radius: 12px;
        padding: 0.9rem 1rem;
      }
      div[data-testid="stMetricvalue"] { color: #ffffff; }
      div[data-testid="stMetricLabel"] { color: #8c8c8c; }

      /* Tabs */
      .stTabs [data-baseweb="tab-list"] { gap: 4px; }
      .stTabs [data-baseweb="tab"] {
        background-color: #1a1a1a;
        border-radius: 10px 10px 0 0;
        color: #b3b3b3;
        padding: 0.5rem 1rem;
      }
      .stTabs [aria-selected="true"] {
        background-color: #1a1a1a;
        color: #00b87a;
        border-bottom: 2px solid #00b87a;
      }

      /* Zutaten-Tabelle */
      .zutat-row {
        display: flex;
        justify-content: space-between;
        padding: 0.55rem 0.9rem;
        border-bottom: 1px solid #1f1f1f;
        border-radius: 8px;
      }
      .zutat-fehlt { background-color: #2a1414; }
      .zutat-name { color: #f5f5f5; }
      .zutat-name-fehlt { color: #ff6b6b; font-weight: 600; }
      .zutat-menge { color: #8c8c8c; }
      .badge-fehlt {
        color: #ff6b6b;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Schritte */
      .schritt {
        display: flex;
        gap: 0.9rem;
        padding: 0.8rem 0;
        border-bottom: 1px solid #1f1f1f;
      }
      .schritt-nr {
        flex: 0 0 28px;
        height: 28px;
        background-color: #00b87a;
        color: #0a0a0a;
        font-weight: 700;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .schritt-text { color: #f5f5f5; }
      .schritt-timer {
        display: inline-block;
        margin-top: 0.3rem;
        color: #00b87a;
        background-color: #0e2620;
        font-size: 0.78rem;
        font-weight: 600;
        padding: 0.15rem 0.55rem;
        border-radius: 6px;
      }
    </style>
    """,
    unsafe_allow_html=True,
)


# --------------------------------------------------------------------------- #
# Hilfsfunktionen
# --------------------------------------------------------------------------- #
def get_client() -> Anthropic | None:
    """Liefert einen Anthropic-Client oder None, wenn kein Key gesetzt ist."""
    api_key = st.secrets.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    return Anthropic(api_key=api_key)


def parse_json(raw: str) -> dict:
    """Parst die Modellantwort robust, auch wenn doch Backticks vorhanden sind."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        # mögliches "json"-Sprachlabel entfernen
        if text.lstrip().lower().startswith("json"):
            text = text.lstrip()[4:]
    # Auf das äußere JSON-Objekt eingrenzen
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    return json.loads(text)


def build_prompt(zutaten, zeit, personen, schwierigkeit, stile) -> str:
    stil_text = ", ".join(stile) if stile else "keine besonderen Vorlieben"
    return (
        f"Vorhandene Zutaten:\n{zutaten}\n\n"
        f"Rahmenbedingungen:\n"
        f"- Maximale Zubereitungszeit: {zeit}\n"
        f"- Anzahl Personen: {personen}\n"
        f"- Gewünschte Schwierigkeit: {schwierigkeit}\n"
        f"- Stil-Vorlieben: {stil_text}\n\n"
        "Schlage genau ein passendes Gericht vor und gib das vollständige "
        "Rezept im vorgegebenen JSON-Format zurück. Markiere bei den Zutaten, "
        "welche bereits vorhanden sind (vorhanden=true) und welche eingekauft "
        "werden müssen (vorhanden=false)."
    )


def rezept_anfordern(client, user_prompt: str) -> dict:
    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    return parse_json(text)


# --------------------------------------------------------------------------- #
# Session-State
# --------------------------------------------------------------------------- #
STILE = ["Comfort Food", "Gesund & leicht", "Vegetarisch", "Vegan", "Low Carb"]
if "stile" not in st.session_state:
    st.session_state.stile = set()
if "rezept" not in st.session_state:
    st.session_state.rezept = None


# --------------------------------------------------------------------------- #
# Kopfbereich & Eingaben
# --------------------------------------------------------------------------- #
st.markdown("# 🍳 KI-Kochassistent")
st.markdown(
    "<p style='color:#8c8c8c;margin-top:-0.6rem;'>Sag mir, was du da hast – "
    "ich schlage dir ein Gericht vor.</p>",
    unsafe_allow_html=True,
)

zutaten = st.text_area(
    "Zutaten im Kühlschrank / Vorrat",
    placeholder="z. B. Hähnchenbrust, Reis, Paprika, Zwiebeln, Knoblauch, Sojasauce …",
    height=130,
)

col1, col2, col3 = st.columns(3)
with col1:
    zeit = st.selectbox("Maximalzeit", ["15 Minuten", "30 Minuten", "45 Minuten", "60+ Minuten"], index=1)
with col2:
    personen = st.selectbox("Personen", ["1", "2", "3–4", "5+"], index=1)
with col3:
    schwierigkeit = st.selectbox("Schwierigkeit", ["Einfach", "Mittel", "Anspruchsvoll"])

st.markdown("<p style='margin-bottom:0.3rem;'>Stil</p>", unsafe_allow_html=True)
stil_cols = st.columns(len(STILE))
for i, stil in enumerate(STILE):
    aktiv = stil in st.session_state.stile
    label = f"✓ {stil}" if aktiv else stil
    if stil_cols[i].button(
        label,
        key=f"stil_{i}",
        type="primary" if aktiv else "secondary",
    ):
        if aktiv:
            st.session_state.stile.discard(stil)
        else:
            st.session_state.stile.add(stil)
        st.rerun()

st.markdown("<div style='height:0.8rem;'></div>", unsafe_allow_html=True)
vorschlagen = st.button("Rezept vorschlagen", type="primary")


# --------------------------------------------------------------------------- #
# API-Aufruf
# --------------------------------------------------------------------------- #
if vorschlagen:
    if not zutaten.strip():
        st.warning("Bitte gib zuerst ein paar Zutaten ein.")
    else:
        client = get_client()
        if client is None:
            st.error(
                "Kein API-Key gefunden. Bitte `ANTHROPIC_API_KEY` in "
                "`.streamlit/secrets.toml` hinterlegen."
            )
        else:
            prompt = build_prompt(
                zutaten, zeit, personen, schwierigkeit, sorted(st.session_state.stile)
            )
            with st.spinner("Koche ein Rezept zusammen …"):
                try:
                    st.session_state.rezept = rezept_anfordern(client, prompt)
                except AuthenticationError:
                    st.session_state.rezept = None
                    st.error("API-Key ungültig. Bitte prüfen.")
                except RateLimitError:
                    st.session_state.rezept = None
                    st.error("Zu viele Anfragen – bitte kurz warten und erneut versuchen.")
                except (APIConnectionError, APIStatusError) as exc:
                    st.session_state.rezept = None
                    st.error(f"Fehler bei der Anfrage: {exc}")
                except (json.JSONDecodeError, ValueError):
                    st.session_state.rezept = None
                    st.error("Die Antwort konnte nicht gelesen werden. Bitte erneut versuchen.")


# --------------------------------------------------------------------------- #
# Ergebnis-Anzeige
# --------------------------------------------------------------------------- #
rezept = st.session_state.rezept
if rezept:
    st.markdown("<div style='height:1.5rem;'></div>", unsafe_allow_html=True)
    st.header(rezept.get("gericht", "Gericht"))

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Schwierigkeit", rezept.get("schwierigkeit", "–"))
    m2.metric("Kalorien / Portion", rezept.get("kalorien_portion", "–"))
    m3.metric("Zubereitungszeit", rezept.get("zubereitungszeit", "–"))
    m4.metric("Personen", personen)

    tab_zutaten, tab_zubereitung, tab_einkauf = st.tabs(
        ["Zutaten", "Zubereitung", "Einkaufsliste"]
    )

    # --- Zutaten ---------------------------------------------------------- #
    with tab_zutaten:
        zutaten_liste = rezept.get("zutaten", [])
        if not zutaten_liste:
            st.info("Keine Zutaten angegeben.")
        for z in zutaten_liste:
            vorhanden = z.get("vorhanden", True)
            name_cls = "zutat-name" if vorhanden else "zutat-name-fehlt"
            row_cls = "zutat-row" if vorhanden else "zutat-row zutat-fehlt"
            badge = "" if vorhanden else "<span class='badge-fehlt'>fehlt</span>"
            st.markdown(
                f"<div class='{row_cls}'>"
                f"<span class='{name_cls}'>{z.get('name', '')}</span>"
                f"<span class='zutat-menge'>{z.get('menge', '')} {badge}</span>"
                f"</div>",
                unsafe_allow_html=True,
            )

    # --- Zubereitung ------------------------------------------------------ #
    with tab_zubereitung:
        schritte = rezept.get("schritte", [])
        if not schritte:
            st.info("Keine Schritte angegeben.")
        for i, schritt in enumerate(schritte, start=1):
            timer = schritt.get("timer")
            timer_html = (
                f"<div><span class='schritt-timer'>⏱ {timer}</span></div>" if timer else ""
            )
            st.markdown(
                f"<div class='schritt'>"
                f"<div class='schritt-nr'>{i}</div>"
                f"<div><div class='schritt-text'>{schritt.get('text', '')}</div>"
                f"{timer_html}</div>"
                f"</div>",
                unsafe_allow_html=True,
            )

    # --- Einkaufsliste ---------------------------------------------------- #
    with tab_einkauf:
        einkauf = rezept.get("einkaufsliste", [])
        if einkauf:
            for artikel in einkauf:
                st.markdown(
                    f"<div class='zutat-row'><span class='zutat-name'>🛒 "
                    f"{artikel}</span></div>",
                    unsafe_allow_html=True,
                )
        else:
            st.success("Alles vorhanden – du musst nichts einkaufen! 🎉")

    # --- Tipp ------------------------------------------------------------- #
    tipp = rezept.get("tipp")
    if tipp:
        st.markdown("<div style='height:0.8rem;'></div>", unsafe_allow_html=True)
        st.info(f"💡 {tipp}")
