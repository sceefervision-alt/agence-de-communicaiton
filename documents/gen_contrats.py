#!/usr/bin/env python3
"""Contrats de ConsultIng : génère les HTML (pour les PDF) et les Word modifiables depuis une seule source.

Usage : python3 documents/gen_contrats.py     (puis node documents/build-pdf.js <dossier documents> <noms…>)
Les champs à remplir s'écrivent entre crochets : [Nom du Client]. **texte** = gras.
"""
import os, re, html
from docx import Document
from docx.shared import Mm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = 'Consult<span class="ii">I</span>ng'
SUB = "Cabinet de diagnostic, structuration<br>et pilotage d’entreprise"
CONTACT = "Yaoundé, Cameroun<br>cabconsulting0@gmail.com<br>WhatsApp +237 680 807 047"
TAGLINE = "ConsultIng · Cabinet de diagnostic, structuration et pilotage d’entreprise"
REPR = "Ada Anita Daniella"

# ------------------------------------------------------------------ contenus
DOCS = {}

DOCS["contrat-prestation-services"] = dict(
    title="Contrat de prestation de services", subtitle="Conseil et pilotage d’entreprise · Cadre général", art_label="Article",
    footer="Contrat de prestation de services",
    blocks=[
        ("between", "Entre les soussignés"),
        ("party", "Le Prestataire", f"**Cabinet ConsultIng**, représenté par {REPR}, Directrice de projets et Consultante en ingénierie financière, dont le siège est situé à Yaoundé, Cameroun.|Courriel : cabconsulting0@gmail.com|Tél. / WhatsApp : +237 680 807 047|Ci-après dénommé « Le Prestataire »,"),
        ("between", "Et"),
        ("party", "Le Client", "**[Nom de la société cliente / Nom du dirigeant]**, au capital de [montant] FCFA, immatriculée sous le n° [n° RCCM / NIU], dont le siège social est situé à [adresse], représentée par [nom du représentant].|Ci-après dénommé « Le Client »,"),
        ("art", 1, "Objet du contrat", [("p", "Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire fournit au Client des prestations de conseil en gouvernance, restructuration financière, audit organisationnel et pilotage d’entreprise.")]),
        ("art", 2, "Modalités et lettre de mission", [("p", "Les caractéristiques précises de chaque intervention (objectifs, calendrier, livrables et tarifs) font l’objet d’une Lettre de Mission spécifique, signée conjointement par les deux parties. En cas de contradiction, la Lettre de Mission prévaut sur le présent contrat-cadre.")]),
        ("art", 3, "Obligations du Prestataire", [("p", "Le Prestataire s’engage à exécuter sa mission avec tout le soin, la diligence et la rigueur professionnelle requis. Le Prestataire est soumis à une obligation de moyens et non de résultat.")]),
        ("art", 4, "Obligations du Client", [("p", "Le Client s’engage à fournir au Prestataire l’ensemble des documents, informations comptables et accès nécessaires à la bonne réalisation du diagnostic et de la mission.")]),
        ("art", 5, "Confidentialité", [("p", "Chacune des parties s’engage à maintenir la confidentialité absolue sur l’ensemble des données financières, stratégies et informations commerciales échangées au cours de la mission.")]),
        ("art", 6, "Conditions financières et règlement", [("p", "Les honoraires sont fixés dans la Lettre de Mission. Un acompte de 50 % est exigible à la signature de la Lettre de Mission, le solde étant payable à la livraison des prestations.")]),
        ("fait", "Fait à Yaoundé, le [date], en deux exemplaires originaux."),
        ("sigs", [("Pour ConsultIng", REPR), ("Pour le Client", "[Nom et signature du dirigeant]")]),
    ])

DOCS["lettre-de-mission"] = dict(
    title="Lettre de mission n° [2026-XX]", subtitle="Modèle opérationnel", art_label="",
    footer="Lettre de mission",
    blocks=[
        ("meta", [("À l’attention de", "[Nom du dirigeant], [Nom de l’entreprise]"), ("Date", "[date]")]),
        ("p", "Madame, Monsieur,"),
        ("p", "Faisant suite à notre consultation initiale, nous vous confirmons les termes de notre intervention :"),
        ("art", 1, "Nature de la mission", [("p", "[Indiquer la formule choisie : Bilan Flash / Audit Global / Accompagnement sur mesure].")]),
        ("art", 2, "Objectifs ciblés", [("ul", ["Radiographie financière et analyse du BFR.", "Stopper les hémorragies de trésorerie et identifier les fuites de rentabilité.", "Mettre en place un tableau de bord et des outils de pilotage."])]),
        ("art", 3, "Livrables", [("p", "Rapport de diagnostic, feuille de route stratégique et outils personnalisés.")]),
        ("art", 4, "Durée et calendrier", [("p", "Mission d’une durée de [ex. : 3 semaines], du [date de début] au [date de fin].")]),
        ("art", 5, "Honoraires et modalités", [("ul", ["Montant total HT : [montant] FCFA.", "Acompte à la signature : 50 % ([montant] FCFA).", "Solde à la restitution de l’audit : 50 % ([montant] FCFA)."])]),
        ("accord", "Bon pour accord et validation des termes", "Date et signature du Client :"),
    ])

DOCS["rapport-de-diagnostic"] = dict(
    title="Rapport de diagnostic et feuille de route stratégique", subtitle="Le médecin des affaires", art_label="",
    footer="Rapport de diagnostic",
    blocks=[
        ("meta", [("Mission", "[Bilan Flash / Audit Global]"), ("Client", "[Nom de l’entreprise / Nom du dirigeant]"), ("Date de restitution", "[date]")]),
        ("art", 1, "Synthèse exécutive : le bilan clinique", [
            ("p", "Rappel du contexte, des symptômes identifiés lors de l’anamnèse et de l’état de santé global de la structure."),
            ("ul", ["**Diagnostic global :** [ex. : trésorerie tendue sous l’effet d’un BFR alourdi par des délais de recouvrement clients trop longs].", "**Impact chiffré :** [ex. : somme immobilisée estimée à X FCFA, pesant sur la capacité d’autofinancement]."])]),
        ("art", 2, "Analyse des signes vitaux et points de blocage", [
            ("p", "Détail des anomalies détectées lors de l’immersion :"),
            ("ul", ["**A. Trésorerie et cycle d’exploitation :** analyse des flux, des encaissements et du décalage avec les décaissements fournisseurs.", "**B. Organisation et processus :** évaluation des rôles internes, de la charge administrative du dirigeant et des outils de gestion en place.", "**C. Rentabilité et marges :** analyse de la structure des coûts et de la couverture du seuil de rentabilité."])]),
        ("art", 3, "L’ordonnance : plan d’action et prescriptions prioritaires", [
            ("p", "Actions correctives classées par ordre d’urgence :"),
            ("sub", "Urgences à traiter immédiatement (stopper les hémorragies)", ["[Ex. : relance ferme des créances en souffrance de plus de 60 jours].", "[Ex. : réduction des charges non essentielles identifiées]."]),
            ("sub", "Structuration à moyen terme (l’ossature)", ["[Ex. : mise en place d’un outil de facturation et de suivi de trésorerie, comme QuickBooks].", "[Ex. : formalisation des procédures de caisse et de validation des dépenses]."]),
            ("sub", "Pilotage stratégique (la boussole)", ["[Ex. : suivi hebdomadaire du tableau de bord des indicateurs financiers]."])]),
        ("art", 4, "Conclusion et prochaines étapes", [("p", "Validation de la feuille de route et passage éventuel à la phase de « Build » et d’accompagnement sur mesure.")]),
        ("signoff", "Rédigé par le Cabinet ConsultIng", f"{REPR}, Directrice de projets et Consultante financière"),
    ])

DOCS["pv-fin-de-mission"] = dict(
    title="Procès-verbal de fin de mission", subtitle="Clôture administrative", art_label="Article",
    footer="Procès-verbal de fin de mission",
    blocks=[
        ("between", "Entre les soussignés"),
        ("party", "Le Prestataire", f"Le **Cabinet ConsultIng**, représenté par {REPR}.|Ci-après dénommé « Le Prestataire »,"),
        ("party", "Le Client", "La Société **[nom de l’entreprise]**, représentée par [nom du dirigeant].|Ci-après dénommé « Le Client »,"),
        ("between", "Il a été convenu ce qui suit"),
        ("art", 1, "Objet", [("p", "Le présent procès-verbal atteste de la fin officielle de la mission de conseil et d’audit intitulée [intitulé de la mission], commandée le [date de signature de la lettre de mission].")]),
        ("art", 2, "Remise des livrables", [("p", "Le Prestataire a remis ce jour au Client l’ensemble des documents prévus au contrat, à savoir :"), ("ul", ["Le rapport de diagnostic complet et sa feuille de route stratégique.", "Les outils de pilotage et tableaux de bord personnalisés.", "Le support de synthèse de la réunion de restitution."])]),
        ("art", 3, "Constat de fin de prestation", [("p", "Le Client reconnaît avoir pris connaissance des livrables, en avoir reçu l’intégralité et confirme que la prestation a été exécutée conformément aux termes de la Lettre de Mission.")]),
        ("art", 4, "Solde financier", [("p", "La remise des documents entraîne l’exigibilité immédiate du solde des honoraires, s’élevant à la somme de [montant] FCFA, conformément aux conditions de paiement convenues.")]),
        ("fait", "Fait à Yaoundé, en deux exemplaires originaux, le [date]."),
        ("sigs", [("Pour le Cabinet ConsultIng", "(Signature)"), ("Pour le Client", "(Signature et cachet de l’entreprise)")]),
    ])

# ------------------------------------------------------------------ rendu HTML
def esc(s): return html.escape(s, quote=False)
def inline(s):
    s = esc(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\[([^\]]+)\]", r'<span class="ph">\1</span>', s)
    return s

def render_html(key, d):
    out = []
    for b in d["blocks"]:
        k = b[0]
        if k == "between": out.append(f'<p class="between">{inline(b[1])}</p>')
        elif k == "party":
            lines = "".join(f"<p>{inline(x)}</p>" for x in b[2].split("|"))
            out.append(f'<div class="party wide"><h3>{inline(b[1])}</h3>{lines}</div>')
        elif k == "meta":
            rows = "".join(f"<div><dt>{inline(a)}</dt><dd>{inline(v)}</dd></div>" for a, v in b[1])
            out.append(f'<dl class="meta">{rows}</dl>')
        elif k == "p": out.append(f'<p class="para">{inline(b[1])}</p>')
        elif k == "art":
            inner = ""
            for c in b[3]:
                if c[0] == "p": inner += f"<p>{inline(c[1])}</p>"
                elif c[0] == "ul": inner += '<ul class="dash">' + "".join(f"<li>{inline(x)}</li>" for x in c[1]) + "</ul>"
                elif c[0] == "sub":
                    inner += f'<h4>{inline(c[1])}</h4><ul class="dash">' + "".join(f"<li>{inline(x)}</li>" for x in c[2]) + "</ul>"
            out.append(f'<article class="art"><div class="num">{b[1]}</div><div><h2>{inline(b[2])}</h2>{inner}</div></article>')
        elif k == "fait": out.append(f'<p class="fait">{inline(b[1])}</p>')
        elif k == "sigs":
            cols = "".join(f'<div class="sig"><h3>{inline(t)}</h3><p>{inline(n)}</p><div class="box-sig"></div></div>' for t, n in b[1])
            out.append(f'<div class="sigs">{cols}</div>')
        elif k == "accord":
            out.append(f'<div class="accord"><h3>{inline(b[1])}</h3><p>{inline(b[2])}</p><div class="box-sig"></div></div>')
        elif k == "signoff":
            out.append(f'<div class="signoff"><b>{inline(b[1])}</b><span>{inline(b[2])}</span></div>')
    return "\n".join(out)

HEAD = ""  # l'en-tête et le pied de page sont ajoutés page par page par build-contrats.js

def page_html(key, d):
    foot = d["footer"]
    return f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>{html.escape(re.sub(r"[\[\]]", "", d["title"]))} – ConsultIng</title>
<link rel="stylesheet" href="shared.css"><link rel="stylesheet" href="contrat.css"><link rel="stylesheet" href="docs.css">
</head>
<body>
{HEAD}
<main class="doc">
  <div class="doc-title"><h1>{inline(d["title"])}</h1><p>{inline(d["subtitle"])}</p></div>
  {render_html(key, d)}
</main>
</body></html>'''

# ------------------------------------------------------------------ rendu Word
WINE = RGBColor(0x5B, 0x0F, 0x1B); INK = RGBColor(0x2B, 0x15, 0x19); GREY = RGBColor(0x7A, 0x64, 0x68)

def add_runs(par, text, size=None, color=None, bold=False):
    parts = re.split(r"(\*\*.+?\*\*|\[[^\]]+\])", text)
    for p in parts:
        if not p: continue
        if p.startswith("**"):
            r = par.add_run(p[2:-2]); r.bold = True
        elif p.startswith("["):
            r = par.add_run(p); r.italic = True; r.font.color.rgb = GREY
        else:
            r = par.add_run(p); r.bold = bold
            if color: r.font.color.rgb = color
        if size: r.font.size = Pt(size)
    return par

def bleed(par, img):
    pf = par.paragraph_format
    pf.left_indent = Mm(-20); pf.right_indent = Mm(-20); pf.space_before = pf.space_after = Pt(0); pf.line_spacing = 1.0
    par.add_run().add_picture(img, width=Mm(210))

def shade(cell, hex_):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), hex_); tcPr.append(sh)

def border_top(cell, color="5B0F1B", sz=12):
    tcPr = cell._tc.get_or_add_tcPr(); b = OxmlElement("w:tcBorders"); t = OxmlElement("w:top")
    t.set(qn("w:val"), "single"); t.set(qn("w:sz"), str(sz)); t.set(qn("w:color"), color); b.append(t); tcPr.append(b)

def new_docx(with_header=True):
    d = Document(); s = d.sections[0]
    s.page_width, s.page_height = Mm(210), Mm(297)
    s.left_margin = s.right_margin = Mm(20); s.top_margin, s.bottom_margin = Mm(46), Mm(28)
    s.header_distance = Mm(0); s.footer_distance = Mm(0)
    bleed(s.header.paragraphs[0], os.path.join(HERE, "img", "conseil-header.png"))
    bleed(s.footer.paragraphs[0], os.path.join(HERE, "img", "conseil-footer.png"))
    st = d.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(10.5); st.font.color.rgb = INK
    st.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    st.paragraph_format.space_after = Pt(6); st.paragraph_format.line_spacing = 1.2
    for name, size in (("Title", 24), ("Heading 2", 13), ("Heading 3", 11.5)):
        x = d.styles[name]; x.font.name = "Georgia"; x.font.size = Pt(size); x.font.bold = False; x.font.color.rgb = WINE
        x.element.rPr.rFonts.set(qn("w:ascii"), "Georgia"); x.element.rPr.rFonts.set(qn("w:hAnsi"), "Georgia")
        x.paragraph_format.space_before = Pt(0 if name == "Title" else 12); x.paragraph_format.space_after = Pt(4)
    pPr = d.styles["Title"].element.get_or_add_pPr()
    for b in pPr.findall(qn("w:pBdr")): pPr.remove(b)
    return d

def render_docx(key, d, path):
    doc = new_docx()
    doc.add_paragraph(re.sub(r"\*\*", "", d["title"]), style="Title")
    p = doc.add_paragraph(); add_runs(p, d["subtitle"], size=11, color=GREY); p.runs[0].italic = True
    for b in d["blocks"]:
        k = b[0]
        if k == "between":
            p = doc.add_paragraph(); r = p.add_run(b[1]); r.italic = True; r.font.name = "Georgia"; r.font.color.rgb = WINE; r.font.size = Pt(11.5)
            p.paragraph_format.space_before = Pt(8)
        elif k == "party":
            t = doc.add_table(rows=1, cols=1); t.alignment = WD_TABLE_ALIGNMENT.CENTER
            c = t.rows[0].cells[0]; shade(c, "F6EDEE"); border_top(c)
            hp = c.paragraphs[0]; r = hp.add_run(b[1]); r.font.name = "Georgia"; r.bold = True; r.font.size = Pt(11.5); r.font.color.rgb = WINE
            for line in b[2].split("|"): add_runs(c.add_paragraph(), line)
            doc.add_paragraph().paragraph_format.space_after = Pt(2)
        elif k == "meta":
            t = doc.add_table(rows=len(b[1]), cols=2)
            for i, (a, v) in enumerate(b[1]):
                c0, c1 = t.rows[i].cells; shade(c0, "F6EDEE"); shade(c1, "F6EDEE")
                r = c0.paragraphs[0].add_run(a); r.bold = True; r.font.color.rgb = WINE
                add_runs(c1.paragraphs[0], v)
                c0.width = Mm(48); c1.width = Mm(122)
            doc.add_paragraph()
        elif k == "p": add_runs(doc.add_paragraph(), b[1])
        elif k == "art":
            label = f'{d["art_label"]} {b[1]} : ' if d["art_label"] else f"{b[1]}. "
            doc.add_paragraph(label + re.sub(r"\*\*", "", b[2]), style="Heading 2")
            for c in b[3]:
                if c[0] == "p": add_runs(doc.add_paragraph(), c[1])
                elif c[0] == "ul":
                    for x in c[1]: add_runs(doc.add_paragraph(style="List Bullet"), x)
                elif c[0] == "sub":
                    doc.add_paragraph(c[1], style="Heading 3")
                    for x in c[2]: add_runs(doc.add_paragraph(style="List Bullet"), x)
        elif k == "fait":
            p = doc.add_paragraph(); add_runs(p, b[1]); p.paragraph_format.space_before = Pt(14)
        elif k == "sigs":
            t = doc.add_table(rows=1, cols=2); t.style = "Table Grid"
            for i, (ti, n) in enumerate(b[1]):
                c = t.rows[0].cells[i]
                r = c.paragraphs[0].add_run(ti); r.bold = True; r.font.color.rgb = WINE
                add_runs(c.add_paragraph(), n, size=9, color=GREY)
                for _ in range(5): c.add_paragraph()
        elif k == "accord":
            doc.add_paragraph().paragraph_format.space_before = Pt(10)
            p = doc.add_paragraph(); r = p.add_run(b[1]); r.bold = True; r.font.name = "Georgia"; r.font.size = Pt(12); r.font.color.rgb = WINE
            doc.add_paragraph(b[2])
            t = doc.add_table(rows=1, cols=1); t.style = "Table Grid"
            for _ in range(6): t.rows[0].cells[0].add_paragraph()
        elif k == "signoff":
            p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(18)
            r = p.add_run(b[1]); r.bold = True; r.font.name = "Georgia"; r.font.color.rgb = WINE
            doc.add_paragraph(b[2])
    doc.save(path)

def render_blank_docx(path):
    doc = new_docx(); doc.add_paragraph("Titre du document", style="Title")
    doc.add_paragraph("Écrivez ici. L’en-tête et le pied de page se répètent sur chaque page.")
    doc.add_paragraph("Titre de section", style="Heading 2"); doc.save(path)

if __name__ == "__main__":
    for key, d in DOCS.items():
        open(os.path.join(HERE, key + ".html"), "w").write(page_html(key, d))
        render_docx(key, d, os.path.join(HERE, key + ".docx"))
        print("ok", key)
    render_blank_docx(os.path.join(HERE, "papier-en-tete-conseil-modele.docx"))
