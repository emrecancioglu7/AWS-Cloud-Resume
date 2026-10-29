#!/usr/bin/env python3
"""Generates the README's animated SVG artwork into docs/readme/ (a dark and a light variant of each).

Run from the repo root after changing any text below:  python3 scripts/build_readme_assets.py
Same approach as the GitHub profile README (~/Documents/GitHub/emrecancioglu7/scripts/build_assets.py):
self-contained SVG (no external fonts, images or services), CSS animations inside the SVG that switch
off for viewers with "reduce motion" enabled, and the same palette as emrecancioglu.com.
"""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent.parent / "docs" / "readme"
FONT = "'Segoe UI', Ubuntu, 'Helvetica Neue', Helvetica, Arial, sans-serif"
MONO_CLASS = 'class="mono"'
MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

PALETTES = {
    "dark": dict(bg1="#0a0d12", bg2="#0e1a18", card="#11161d", card_border="#1f2a33", grid="#1a2430",
                 text="#ececea", muted="#9aa3ab", accent="#34d399", accent2="#38bdf8", accent3="#fbbf24",
                 accent_soft="#34d39922"),
    "light": dict(bg1="#ffffff", bg2="#ecfdf5", card="#ffffff", card_border="#d7e3dd", grid="#e3ece8",
                  text="#17181a", muted="#5b6168", accent="#059669", accent2="#0284c7", accent3="#d97706",
                  accent_soft="#05966914"),
}

BASE_STYLE = """
    .fade { opacity: 0; animation: fade .7s ease-out forwards; }
    @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .pulse { stroke-dasharray: 16 600; stroke-dashoffset: 616; animation: flow 2.4s linear infinite; }
    @keyframes flow { to { stroke-dashoffset: 0; } }
"""
REDUCED_MOTION = "@media (prefers-reduced-motion: reduce) { * { animation: none !important; } .fade { opacity: 1; } }"


def svg(width, height, body, style, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" '
            f'role="img" aria-label="{escape(title)}"><title>{escape(title)}</title>'
            f'<style>text {{ font-family: {FONT}; }} .mono {{ font-family: {MONO}; }} {BASE_STYLE} {style} {REDUCED_MOTION}</style>'
            f'{body}</svg>')


def t(x, y, s, size, fill, weight=400, anchor="start", extra=""):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" {extra}>{escape(s)}</text>'


def backdrop(p, w, h, glow_cx=0.8):
    return f'''
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{p["bg1"]}"/><stop offset="1" stop-color="{p["bg2"]}"/></linearGradient>
      <radialGradient id="glow" cx="{glow_cx}" cy="0.5" r="0.5"><stop offset="0" stop-color="{p["accent"]}" stop-opacity="0.18"/><stop offset="1" stop-color="{p["accent"]}" stop-opacity="0"/></radialGradient>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="{p["grid"]}" stroke-width="1"/></pattern>
    </defs>
    <rect width="{w}" height="{h}" rx="18" fill="url(#bg)"/>
    <rect width="{w}" height="{h}" rx="18" fill="url(#grid)" opacity="0.5"/>
    <rect width="{w}" height="{h}" rx="18" fill="url(#glow)"/>
    <rect x="0.5" y="0.5" width="{w - 1}" height="{h - 1}" rx="18" fill="none" stroke="{p["card_border"]}"/>'''


# ---------------------------------------------------------------- hero banner
def hero(p):
    w, h = 1200, 360
    # Terminal lines type out one after another, then the whole cycle repeats.
    lines = [("$ terraform apply", p["text"]),
             ("✓ Apply complete! backend is live", p["accent"]),
             ("$ git push origin main", p["text"]),
             ("✓ deployed → S3 + CloudFront invalidated", p["accent"])]
    term_x, term_y, term_w = 700, 92, 440
    term = [f'<rect x="{term_x}" y="{term_y}" width="{term_w}" height="190" rx="12" fill="{p["card"]}" stroke="{p["card_border"]}"/>',
            f'<path d="M{term_x} {term_y + 12}a12 12 0 0 1 12-12h{term_w - 24}a12 12 0 0 1 12 12v22H{term_x}z" fill="{p["grid"]}"/>']
    for i, c in enumerate(["#f87171", "#fbbf24", "#34d399"]):
        term.append(f'<circle cx="{term_x + 20 + i * 18}" cy="{term_y + 17}" r="5" fill="{c}"/>')
    term.append(t(term_x + term_w / 2, term_y + 22, "~/AWS-Cloud-Resume", 12, p["muted"], 500, "middle", MONO_CLASS))
    for i, (s, c) in enumerate(lines):
        y = term_y + 70 + i * 32
        term.append(f'<clipPath id="ln{i}"><rect x="{term_x + 20}" y="{y - 18}" width="0" height="26" class="type" '
                    f'style="animation-delay:{i * 1.4:.1f}s"/></clipPath>')
        term.append(f'<g clip-path="url(#ln{i})">{t(term_x + 22, y, s, 14, c, 500, extra=MONO_CLASS)}</g>')
    term.append(f'<rect x="{term_x + 22}" y="{term_y + 70 + 3 * 32 + 14}" width="9" height="16" fill="{p["accent"]}" class="cursor"/>')

    body = f'''{backdrop(p, w, h)}
    <g class="fade">{t(64, 96, "THE CLOUD RESUME CHALLENGE", 15, p["accent"], 700, extra='letter-spacing="3"')}</g>
    <g class="fade" style="animation-delay:.15s">{t(62, 162, "AWS Cloud Resume", 60, p["text"], 700)}</g>
    <g class="fade" style="animation-delay:.3s">{t(64, 204, "Serverless resume site + private admin panel", 22, p["muted"])}</g>
    <g class="fade" style="animation-delay:.45s">{t(64, 236, "React 19 · Lambda · DynamoDB · Cognito · Terraform", 18, p["muted"])}</g>
    <g class="fade" style="animation-delay:.6s">
      <rect x="64" y="266" width="236" height="42" rx="21" fill="{p["accent_soft"]}" stroke="{p["accent"]}" stroke-opacity="0.5"/>
      {t(182, 293, "emrecancioglu.com  →", 16, p["accent"], 600, "middle")}
    </g>
    <g class="fade" style="animation-delay:.4s">{"".join(term)}</g>'''
    style = """
    .type { animation: type 7s steps(40, end) infinite; }
    @keyframes type { 0% { width: 0; } 18%, 92% { width: 420px; } 100% { width: 0; } }
    .cursor { animation: blink 1s steps(2, start) infinite; }
    @keyframes blink { to { visibility: hidden; } }
    """
    return svg(w, h, body, style, "AWS Cloud Resume — serverless resume site and admin panel on AWS, built for the Cloud Resume Challenge")


# ---------------------------------------------------------------- architecture
def node(p, x, y, w, h, title, sub, color, delay):
    return f'''<g class="fade" style="animation-delay:{delay:.2f}s">
      <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{p["card"]}" stroke="{color}" stroke-opacity="0.65" stroke-width="1.5"/>
      <rect x="{x}" y="{y + 14}" width="4" height="{h - 28}" rx="2" fill="{color}"/>
      {t(x + w / 2, y + h / 2 - 2, title, 16, p["text"], 700, "middle")}
      {t(x + w / 2, y + h / 2 + 18, sub, 12, p["muted"], 400, "middle")}
    </g>'''


def edge(p, d, color, delay, label=None, lx=0, ly=0):
    out = (f'<path d="{d}" fill="none" stroke="{p["grid"]}" stroke-width="2"/>'
           f'<path d="{d}" fill="none" stroke="{color}" stroke-width="3" stroke-linecap="round" class="pulse" style="animation-delay:{delay:.2f}s"/>')
    if label:
        out += t(lx, ly, label, 11, p["muted"], 500, "middle")
    return out


def architecture(p):
    w, h = 1200, 620
    nw, nh = 160, 64
    cols = [280, 520, 760, 1000]
    lanes = [(130, "PUBLIC SITE", p["accent2"]), (300, "ADMIN API", p["accent"]), (470, "AI STATEMENT ANALYSIS", p["accent3"])]
    out = [backdrop(p, w, h, 0.5)]

    # Terraform-managed area (lanes 2 and 3) behind everything else.
    out.append(f'<rect x="258" y="236" width="922" height="352" rx="16" fill="none" stroke="{p["muted"]}" stroke-opacity="0.45" stroke-dasharray="6 6"/>')
    out.append(t(1160, 260, "provisioned with Terraform", 12, p["muted"], 600, "end"))
    out.append(t(64, 52, "ARCHITECTURE", 14, p["accent"], 700, extra='letter-spacing="3"'))

    for y, name, color in lanes:
        out.append(t(280, y - 46, name, 11, color, 700, extra='letter-spacing="2"'))

    # Browser on the left, feeding every lane.
    out.append(f'''<g class="fade">
      <rect x="50" y="98" width="140" height="436" rx="14" fill="{p["card"]}" stroke="{p["card_border"]}" stroke-width="1.5"/>
      <circle cx="120" cy="290" r="38" fill="{p["accent"]}" fill-opacity="0.12" class="ring"/>
      <circle cx="120" cy="290" r="28" fill="none" stroke="{p["text"]}" stroke-width="2"/>
      <path d="M92 290h56M120 262c-12 14-12 42 0 56M120 262c12 14 12 42 0 56" fill="none" stroke="{p["text"]}" stroke-width="2"/>
      {t(120, 352, "Browser", 16, p["text"], 700, "middle")}
      {t(120, 372, "visitor / admin", 12, p["muted"], 400, "middle")}
    </g>''')

    edges, nodes = [], []
    # Lane 1: Route 53 → CloudFront → S3, GitHub Actions deploys into S3.
    y = lanes[0][0]
    c = lanes[0][2]
    edges.append(edge(p, f"M190 {y + nh / 2} H{cols[0]}", c, 0))
    edges.append(edge(p, f"M{cols[0] + nw} {y + nh / 2} H{cols[1]}", c, .4))
    edges.append(edge(p, f"M{cols[1] + nw} {y + nh / 2} H{cols[2]}", c, .8))
    edges.append(edge(p, f"M{cols[3]} {y + nh / 2} H{cols[2] + nw}", p["muted"], 1.2, "deploy", (cols[2] + nw + cols[3]) / 2, y + nh / 2 - 10))
    nodes += [node(p, cols[0], y, nw, nh, "Route 53", "DNS · ACM TLS", c, .1),
              node(p, cols[1], y, nw, nh, "CloudFront", "CDN · HTTPS", c, .2),
              node(p, cols[2], y, nw, nh, "S3", "prerendered EN/TR site", c, .3),
              node(p, cols[3], y, nw, nh, "GitHub Actions", "deploy on push", p["muted"], .4)]

    # Lane 2: Cognito → API Gateway → Lambda → DynamoDB (tall, shared with lane 3).
    y = lanes[1][0]
    c = lanes[1][2]
    ddb_y, ddb_h = y, lanes[2][0] + nh - y
    edges.append(edge(p, f"M190 {y + nh / 2} H{cols[0]}", c, .2, "SRP + TOTP", 235, y + nh / 2 - 10))
    edges.append(edge(p, f"M{cols[0] + nw} {y + nh / 2} H{cols[1]}", c, .6, "JWT", (cols[0] + nw + cols[1]) / 2, y + nh / 2 - 10))
    edges.append(edge(p, f"M{cols[1] + nw} {y + nh / 2} H{cols[2]}", c, 1.0))
    edges.append(edge(p, f"M{cols[2] + nw} {y + nh / 2} H{cols[3]}", c, 1.4))
    nodes += [node(p, cols[0], y, nw, nh, "Cognito", "user pool · MFA", c, .3),
              node(p, cols[1], y, nw, nh, "API Gateway", "HTTP API · JWT auth", c, .4),
              node(p, cols[2], y, nw, nh, "Lambda · API", "Node 20 · TypeScript", c, .5),
              node(p, cols[3], ddb_y, nw, ddb_h, "DynamoDB", "single-table design", p["accent"], .6)]

    # Lane 3: presigned upload → S3 statements → processor Lambda ⇄ OpenAI, results into DynamoDB.
    y = lanes[2][0]
    c = lanes[2][2]
    mid = y + nh / 2
    edges.append(edge(p, f"M190 {mid} H{cols[0]}", c, .4, "presigned PUT", 235, mid - 10))
    edges.append(edge(p, f"M{cols[0] + nw} {mid} H{cols[1]}", c, .8, "S3 event", (cols[0] + nw + cols[1]) / 2, mid - 10))
    edges.append(edge(p, f"M{cols[1] + nw} {mid - 10} H{cols[2]}", c, 1.2, "PDF → JSON", (cols[1] + nw + cols[2]) / 2, mid - 18))
    edges.append(edge(p, f"M{cols[2]} {mid + 10} H{cols[1] + nw}", c, 1.8))
    edges.append(edge(p, f"M{cols[1] + nw / 2} {y + nh} V{y + nh + 26} H{cols[3] + nw / 2} V{y + nh}", c, 2.2,
                      "transactions + categories", (cols[2] + cols[3]) / 2 + 40, y + nh + 20))
    nodes += [node(p, cols[0], y, nw, nh, "S3 · Statements", "PDF uploads", c, .5),
              node(p, cols[1], y, nw, nh, "Lambda · Processor", "key from SSM", c, .6),
              node(p, cols[2], y, nw, nh, "OpenAI", "structured outputs", c, .7)]

    out += edges + nodes
    style = """
    .ring { transform-origin: 120px 290px; animation: ring 2.4s ease-in-out infinite; }
    @keyframes ring { 0%,100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.4); opacity: .2; } }
    """
    return svg(w, h, "".join(out), style,
               "Architecture: Browser → Route 53 → CloudFront → S3 for the public site (deployed by GitHub Actions); "
               "Browser → Cognito → API Gateway → Lambda → DynamoDB for the admin API; "
               "Browser → S3 statements bucket → processor Lambda ⇄ OpenAI → DynamoDB for statement analysis. "
               "Backend provisioned with Terraform.")


# ---------------------------------------------------------------- feature cards
FEATURES = [
    ("🌐", "Public resume site", ["React 19 · Vite · Tailwind v4", "English + Turkish, dark/light", "SSR-prerendered, SEO-checked"], "accent2"),
    ("🔐", "Private admin panel", ["Cognito SRP login + TOTP MFA", "TEFAS fund portfolio tracker", "Lazy-loaded, kept out of /"], "accent"),
    ("🤖", "AI statement analysis", ["Credit card PDF → S3 → Lambda", "OpenAI extracts + categorizes", "Spending & budget summaries"], "accent3"),
    ("🏗", "Infrastructure as code", ["Terraform, least-privilege IAM", "Designed for the free tier", "AWS Budgets cost alarm"], "accent"),
]


def features(p):
    w, h = 1200, 230
    cw, gap = 286, 16
    out = []
    for i, (emoji, title, lines, key) in enumerate(FEATURES):
        x = i * (cw + gap) + 4
        c = p[key]
        rows = "".join(t(x + 24, 120 + j * 28, "▸ " + s, 14, p["muted"]) for j, s in enumerate(lines))
        out.append(f'''<g class="fade" style="animation-delay:{i * 0.15:.2f}s">
      <rect x="{x}" y="4" width="{cw}" height="{h - 8}" rx="14" fill="{p["card"]}" stroke="{p["card_border"]}" stroke-width="1.5"/>
      <rect x="{x}" y="4" width="{cw}" height="4" rx="2" fill="{c}"/>
      <rect x="{x}" y="4" width="60" height="4" rx="2" fill="#ffffff" opacity="0.6" class="shine" style="animation-delay:{i * 0.5:.1f}s"/>
      {t(x + 24, 56, emoji, 24, p["text"])}
      {t(x + 64, 56, title, 18, p["text"], 700)}
      <line x1="{x + 24}" y1="78" x2="{x + cw - 24}" y2="78" stroke="{p["card_border"]}"/>
      {rows}
    </g>''')
    style = """
    .shine { animation: shine 3s ease-in-out infinite; }
    @keyframes shine { 0% { transform: translateX(0); opacity: 0; } 20% { opacity: .6; } 60%,100% { transform: translateX(216px); opacity: 0; } }
    """
    alt = " · ".join(f"{title}: {', '.join(lines)}" for _, title, lines, _ in FEATURES)
    return svg(w, h, "".join(out), style, alt)


# ---------------------------------------------------------------- deploy pipeline
PIPELINE = [("git push", "main"), ("npm build", "tsc + vite"), ("prerender", "EN · TR · SSR"),
            ("check", "SEO guardrails"), ("S3 sync", "cache rules"), ("CloudFront", "invalidate"), ("IndexNow", "ping search")]


def pipeline(p):
    w, h = 1200, 170
    x0, x1, y = 90, 1110, 70
    step = (x1 - x0) / (len(PIPELINE) - 1)
    period = 7.0
    out = [backdrop(p, w, h, 0.5),
           f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}" stroke="{p["grid"]}" stroke-width="4" stroke-linecap="round"/>',
           f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}" stroke="{p["accent"]}" stroke-width="4" stroke-linecap="round" class="progress"/>']
    for i, (name, sub) in enumerate(PIPELINE):
        x = x0 + i * step
        out.append(f'<circle cx="{x:.1f}" cy="{y}" r="14" fill="{p["card"]}" stroke="{p["accent"]}" stroke-width="3"/>')
        out.append(f'<circle cx="{x:.1f}" cy="{y}" r="8" fill="{p["accent"]}" style="animation: lit{i} {period}s linear infinite"/>')
        out.append(t(f"{x:.1f}", y + 44, name, 15, p["text"], 700, "middle"))
        out.append(t(f"{x:.1f}", y + 64, sub, 12, p["muted"], 400, "middle"))
    style = f"""
    .progress {{ stroke-dasharray: {x1 - x0}; stroke-dashoffset: {x1 - x0}; animation: run {period}s linear infinite; }}
    @keyframes run {{ 80%, 92% {{ stroke-dashoffset: 0; opacity: 1; }} 100% {{ stroke-dashoffset: 0; opacity: 0; }} }}
    """
    # Each step's dot lights up when the progress line reaches it (the line covers the track in 80% of the period).
    for i in range(len(PIPELINE)):
        reach = 80 * i / (len(PIPELINE) - 1)
        style += f"@keyframes lit{i} {{ 0%, {max(reach - 0.1, 0):.1f}% {{ fill-opacity: {1 if i == 0 else 0}; }} {reach:.1f}%, 92% {{ fill-opacity: 1; }} 100% {{ fill-opacity: 0; }} }}\n"
    return svg(w, h, "".join(out), style,
               "Frontend deploy pipeline on every push to main: " + " → ".join(n for n, _ in PIPELINE))


# ---------------------------------------------------------------- footer
def footer(p):
    w, h = 1200, 120
    body = f'''<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{p["accent"]}"/><stop offset="1" stop-color="{p["accent2"]}"/></linearGradient></defs>
    <path class="wave" d="M0,60 C200,10 400,110 600,60 C800,10 1000,110 1200,60 L1240,120 L-40,120Z" fill="url(#g)" opacity="0.18"/>
    <path class="wave2" d="M0,80 C200,40 400,120 600,80 C800,40 1000,120 1200,80 L1240,120 L-40,120Z" fill="url(#g)" opacity="0.12"/>
    {t(600, 52, "Built on AWS · deployed from this repo · emrecancioglu.com", 15, p["muted"], 500, "middle")}'''
    style = """.wave { animation: sway 6s ease-in-out infinite alternate; }
    .wave2 { animation: sway 8s ease-in-out infinite alternate-reverse; }
    @keyframes sway { to { transform: translateX(-40px); } }"""
    return svg(w, h, body, style, "Built on AWS, deployed from this repo — emrecancioglu.com")



# ---------------------------------------------------------------- badges
# Badges are generated here too instead of linking img.shields.io: GitHub's image proxy (camo)
# regularly times out on shields.io (HTTP 504), which shows up as broken images in the README.
# Brand icon paths are from Simple Icons (CC0, simpleicons.org), 24x24 viewBox.
BADGE_FONT = "Verdana, 'DejaVu Sans', Geneva, sans-serif"


def text_width(s, size=11):
    """Rough Verdana advance widths; the text is then forced to this width with textLength."""
    w = 0.0
    for ch in s:
        if ch in "il.,:;|!'·":
            w += 0.33
        elif ch == " ":
            w += 0.35
        elif ch in "mwMW":
            w += 0.95
        elif ch.isupper() or ch.isdigit():
            w += 0.72
        else:
            w += 0.6
    return w * size


def badge(label, value, color, icon=None, label_color="#24292f"):
    h, pad, size = 28, 10, 11
    icon_w = 20 if icon else 0
    segs = []  # (x, width, fill, text)
    x = 0
    if label:
        lw = pad + icon_w + text_width(label) + pad
        segs.append((x, lw, label_color, label))
        x += lw
    vw = (0 if label else icon_w) + pad + text_width(value) + pad
    segs.append((x, vw, color, value))
    w = x + vw
    parts = []
    for i, (sx, sw, fill, text) in enumerate(segs):
        parts.append(f'<rect x="{sx:.1f}" width="{sw:.1f}" height="{h}" fill="{fill}"/>')
        tx = sx + pad + (icon_w if i == 0 else 0)
        tw = text_width(text)
        parts.append(f'<text x="{tx:.1f}" y="18.5" font-size="{size}" font-weight="600" fill="#ffffff" '
                     f'textLength="{tw:.1f}" lengthAdjust="spacingAndGlyphs">{escape(text)}</text>')
    if icon:
        parts.append(f'<svg x="{pad}" y="7" width="14" height="14" viewBox="0 0 24 24"><path fill="#ffffff" d="{ICONS[icon]}"/></svg>')
    alt = f"{label}: {value}" if label else value
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h}" viewBox="0 0 {w:.1f} {h}" role="img" aria-label="{escape(alt)}">'
            f'<title>{escape(alt)}</title><style>text {{ font-family: {BADGE_FONT}; letter-spacing: .2px; }}</style>'
            f'<clipPath id="r"><rect width="{w:.1f}" height="{h}" rx="6"/></clipPath><g clip-path="url(#r)">{"".join(parts)}</g></svg>')


ICONS = {
    "amazonwebservices": "M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.383.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z",
    "terraform": "M1.44 0v7.575l6.561 3.79V3.787zm21.12 4.227l-6.561 3.791v7.574l6.56-3.787zM8.72 4.23v7.575l6.561 3.787V8.018zm0 8.405v7.575L15.28 24v-7.578z",
    "react": "M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z",
    "typescript": "M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z",
    "vite": "m8.286 10.578.512-8.657a.306.306 0 0 1 .247-.282L17.377.006a.306.306 0 0 1 .353.385l-1.558 5.403a.306.306 0 0 0 .352.385l2.388-.46a.306.306 0 0 1 .332.438l-6.79 13.55-.123.19a.294.294 0 0 1-.252.14c-.177 0-.35-.152-.305-.369l1.095-5.301a.306.306 0 0 0-.388-.355l-1.433.435a.306.306 0 0 1-.389-.354l.69-3.375a.306.306 0 0 0-.37-.36l-2.32.536a.306.306 0 0 1-.374-.316zm14.976-7.926L17.284 3.74l-.544 1.887 2.077-.4a.8.8 0 0 1 .84.369.8.8 0 0 1 .034.783L12.9 19.93l-.013.025-.015.023-.122.19a.801.801 0 0 1-.672.37.826.826 0 0 1-.634-.302.8.8 0 0 1-.16-.67l1.029-4.981-1.12.34a.81.81 0 0 1-.86-.262.802.802 0 0 1-.165-.67l.63-3.08-2.027.468a.808.808 0 0 1-.768-.233.81.81 0 0 1-.217-.6l.389-6.57-7.44-1.33a.612.612 0 0 0-.64.906L11.58 23.691a.612.612 0 0 0 1.066-.004l11.26-20.135a.612.612 0 0 0-.644-.9z",
    "tailwindcss": "M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z",
    "nodedotjs": "M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z",
    "githubactions": "M10.984 13.836a.5.5 0 0 1-.353-.146l-.745-.743a.5.5 0 1 1 .706-.708l.392.391 1.181-1.18a.5.5 0 0 1 .708.707l-1.535 1.533a.504.504 0 0 1-.354.146zm9.353-.147l1.534-1.532a.5.5 0 0 0-.707-.707l-1.181 1.18-.392-.391a.5.5 0 1 0-.706.708l.746.743a.497.497 0 0 0 .706-.001zM4.527 7.452l2.557-1.585A1 1 0 0 0 7.09 4.17L4.533 2.56A1 1 0 0 0 3 3.406v3.196a1.001 1.001 0 0 0 1.527.85zm2.03-2.436L4 6.602V3.406l2.557 1.61zM24 12.5c0 1.93-1.57 3.5-3.5 3.5a3.503 3.503 0 0 1-3.46-3h-2.08a3.503 3.503 0 0 1-3.46 3 3.502 3.502 0 0 1-3.46-3h-.558c-.972 0-1.85-.399-2.482-1.042V17c0 1.654 1.346 3 3 3h.04c.244-1.693 1.7-3 3.46-3 1.93 0 3.5 1.57 3.5 3.5S13.43 24 11.5 24a3.502 3.502 0 0 1-3.46-3H8c-2.206 0-4-1.794-4-4V9.899A5.008 5.008 0 0 1 0 5c0-2.757 2.243-5 5-5s5 2.243 5 5a5.005 5.005 0 0 1-4.952 4.998A2.482 2.482 0 0 0 7.482 12h.558c.244-1.693 1.7-3 3.46-3a3.502 3.502 0 0 1 3.46 3h2.08a3.503 3.503 0 0 1 3.46-3c1.93 0 3.5 1.57 3.5 3.5zm-15 8c0 1.378 1.122 2.5 2.5 2.5s2.5-1.122 2.5-2.5-1.122-2.5-2.5-2.5S9 19.122 9 20.5zM5 9c2.206 0 4-1.794 4-4S7.206 1 5 1 1 2.794 1 5s1.794 4 4 4zm9 3.5c0-1.378-1.122-2.5-2.5-2.5S9 11.122 9 12.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5zm9 0c0-1.378-1.122-2.5-2.5-2.5S18 11.122 18 12.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5zm-13 8a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0zm2 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0zm12 0c0 1.93-1.57 3.5-3.5 3.5a3.503 3.503 0 0 1-3.46-3.002c-.007.001-.013.005-.021.005l-.506.017h-.017a.5.5 0 0 1-.016-.999l.506-.017c.018-.002.035.006.052.007A3.503 3.503 0 0 1 20.5 17c1.93 0 3.5 1.57 3.5 3.5zm-1 0c0-1.378-1.122-2.5-2.5-2.5S18 19.122 18 20.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5z",
    "vitest": "M13.74024 1.05293a.49504.49504 0 0 0-.1569.02512.49338.49338 0 0 0-.25056.1876L7.59513 9.56159a.4895.4895 0 0 0-.08373.22327.48846.48846 0 0 0 .03163.23629.4893.4893 0 0 0 .13985.19319.4927.4927 0 0 0 .2149.10481l3.70685.78609-.22947 4.58007a.48834.48834 0 0 0 .08466.30017.49205.49205 0 0 0 .24931.18854c.10157.03398.21174.03444.3135.00064a.49387.49387 0 0 0 .25056-.18761l5.73735-8.29594a.4884.4884 0 0 0 .08404-.22327c.009-.08015-.0016-.16137-.03163-.23629a.48835.48835 0 0 0-.13985-.19319.49318.49318 0 0 0-.2149-.1048l-3.70686-.7861.22947-4.58008a.48802.48802 0 0 0-.08466-.30017.4913.4913 0 0 0-.24931-.18853.49439.49439 0 0 0-.1566-.02574zM1.15697 9.78795c-.30647.0012-.60009.12378-.81679.34048a1.16107 1.16107 0 0 0-.34017.81648 1.162 1.162 0 0 0 .33366.81957l10.84241 10.8421a1.15762 1.15762 0 0 0 .37677.25211 1.1583 1.1583 0 0 0 .44467.08838c.00084 0 .0016-.00031.0025-.00031.00073 0 .0014.00031.0022.00031a1.15827 1.15827 0 0 0 .44467-.08838 1.15731 1.15731 0 0 0 .37677-.2521l10.84236-10.8421a1.16272 1.16272 0 0 0 .33397-.81958c-.0013-.30647-.12376-.59976-.34048-.81648a1.1616 1.1616 0 0 0-.81679-.34048 1.16114 1.16114 0 0 0-.81926.33366l-5.4012 5.4009c-.0078.0074-.01718.01255-.02482.02015L12 20.14011l-4.59776-4.59745c-.0074-.0074-.01659-.01238-.02419-.01954l-5.4015-5.40151a1.162 1.162 0 0 0-.81958-.33366Z",
}

BADGES = [  # file name, label, value, color, icon
    ("live", "live", "emrecancioglu.com", "#059669", None),
    ("challenge", "Cloud Resume", "Challenge", "#c2410c", None),
    ("aws", None, "AWS", "#232f3e", "amazonwebservices"),
    ("terraform", None, "Terraform", "#7b42bc", "terraform"),
    ("react", None, "React 19", "#20232a", "react"),
    ("typescript", None, "TypeScript", "#3178c6", "typescript"),
    ("vite", None, "Vite", "#646cff", "vite"),
    ("tailwind", None, "Tailwind v4", "#0e7490", "tailwindcss"),
    ("node", None, "Node 20", "#339933", "nodedotjs"),
    ("github-actions", None, "GitHub Actions", "#2088ff", "githubactions"),
    ("vitest", None, "Vitest", "#5c8a12", "vitest"),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("hero", hero), ("architecture", architecture), ("features", features),
                     ("pipeline", pipeline), ("footer", footer)]:
        for mode, p in PALETTES.items():
            (OUT / f"{name}-{mode}.svg").write_text(fn(p), encoding="utf-8")
    badge_dir = OUT / "badges"
    badge_dir.mkdir(exist_ok=True)
    for name, label, value, color, icon in BADGES:
        (badge_dir / f"{name}.svg").write_text(badge(label, value, color, icon), encoding="utf-8")
    print(f"wrote {len(PALETTES) * 5} files to {OUT} and {len(BADGES)} badges to {badge_dir}")


if __name__ == "__main__":
    main()
