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


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("hero", hero), ("architecture", architecture), ("features", features),
                     ("pipeline", pipeline), ("footer", footer)]:
        for mode, p in PALETTES.items():
            (OUT / f"{name}-{mode}.svg").write_text(fn(p), encoding="utf-8")
    print(f"wrote {len(PALETTES) * 5} files to {OUT}")


if __name__ == "__main__":
    main()
