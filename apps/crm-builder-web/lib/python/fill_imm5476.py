"""
fill_imm5476.py
IMM 5476 — Use of a Representative
Auto-fills with Newton Immigration RCIC details
"""
import sys
import json

# Newton Immigration RCIC details
RCIC_NAME = "Navdeep Singh Sandhu"
RCIC_NUMBER = "R-705964"
RCIC_COMPANY = "Newton Immigration Inc."
RCIC_ADDRESS = "Suite 300, 9850 King George Blvd, Surrey BC V3T 0P9"
RCIC_EMAIL = "newtonimmigration@gmail.com"
RCIC_PHONE = "+1 778-723-6662"

EMPTY_CLIENT = {
    "family_name": "",
    "given_name": "",
    "dob": "",
    "passport_number": "",
    "country_of_citizenship": "",
    "uci": "",
    "rep_family_name": RCIC_NAME.split()[-1],
    "rep_given_name": " ".join(RCIC_NAME.split()[:-1]),
    "rep_company": RCIC_COMPANY,
    "rep_address": RCIC_ADDRESS,
    "rep_email": RCIC_EMAIL,
    "rep_phone": RCIC_PHONE,
    "rep_rcic_number": RCIC_NUMBER,
    "declaration_date": "",
}

def fill_imm5476(client_data: dict, blank_pdf_path: str, output_path: str):
    """Fill IMM5476 form with client and representative data"""
    try:
        from pypdf import PdfReader, PdfWriter
        from pypdf.generic import NameObject, create_string_object
        
        reader = PdfReader(blank_pdf_path)
        writer = PdfWriter()
        writer.append(reader)
        
        # Field mappings for IMM5476
        field_map = {
            # Applicant section
            "form1[0].Page1[0].#subform[0].Applicant[0].FamilyName[0]": client_data.get("family_name", ""),
            "form1[0].Page1[0].#subform[0].Applicant[0].GivenName[0]": client_data.get("given_name", ""),
            "form1[0].Page1[0].#subform[0].Applicant[0].DOB[0]": client_data.get("dob", ""),
            "form1[0].Page1[0].#subform[0].Applicant[0].ClientID[0]": client_data.get("uci", ""),
            
            # Representative section
            "form1[0].Page1[0].#subform[0].Representative[0].FamilyName[0]": client_data.get("rep_family_name", RCIC_NAME.split()[-1]),
            "form1[0].Page1[0].#subform[0].Representative[0].GivenName[0]": client_data.get("rep_given_name", " ".join(RCIC_NAME.split()[:-1])),
            "form1[0].Page1[0].#subform[0].Representative[0].CompanyName[0]": RCIC_COMPANY,
            "form1[0].Page1[0].#subform[0].Representative[0].Address[0]": RCIC_ADDRESS,
            "form1[0].Page1[0].#subform[0].Representative[0].Email[0]": RCIC_EMAIL,
            "form1[0].Page1[0].#subform[0].Representative[0].TelephoneNumber[0]": RCIC_PHONE,
            "form1[0].Page1[0].#subform[0].Representative[0].MembershipNumber[0]": RCIC_NUMBER,
        }
        
        # Try to fill fields
        try:
            writer.update_page_form_field_values(writer.pages[0], field_map)
        except Exception:
            # Fallback - try direct field update
            for page in writer.pages:
                if "/Annots" in page:
                    for annot in page["/Annots"]:
                        obj = annot.get_object()
                        if obj.get("/T") and str(obj["/T"]) in field_map:
                            obj.update({
                                NameObject("/V"): create_string_object(field_map[str(obj["/T"])]),
                                NameObject("/AS"): create_string_object(field_map[str(obj["/T"])])
                            })
        
        with open(output_path, "wb") as f:
            writer.write(f)
        print(f"IMM5476 filled: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error filling IMM5476: {e}", file=sys.stderr)
        # Create a simple text-based fallback
        _create_text_fallback(client_data, output_path)
        return True

def _create_text_fallback(client_data: dict, output_path: str):
    """Create a simple PDF when form filling fails"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=14, spaceAfter=12)
        elements.append(Paragraph("IMM 5476 — Use of a Representative", title_style))
        elements.append(Paragraph(f"Newton Immigration Inc. — {RCIC_NAME}, RCIC {RCIC_NUMBER}", styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))
        
        data = [
            ["APPLICANT INFORMATION", ""],
            ["Family Name:", client_data.get("family_name", "")],
            ["Given Name:", client_data.get("given_name", "")],
            ["Date of Birth:", client_data.get("dob", "")],
            ["UCI Number:", client_data.get("uci", "")],
            ["", ""],
            ["REPRESENTATIVE INFORMATION", ""],
            ["Name:", RCIC_NAME],
            ["RCIC Number:", RCIC_NUMBER],
            ["Company:", RCIC_COMPANY],
            ["Address:", RCIC_ADDRESS],
            ["Email:", RCIC_EMAIL],
            ["Phone:", RCIC_PHONE],
        ]
        
        table = Table(data, colWidths=[2.5*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('BACKGROUND', (0,6), (-1,6), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('TEXTCOLOR', (0,6), (-1,6), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTNAME', (0,6), (-1,6), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(table)
        doc.build(elements)
    except Exception as e:
        print(f"Fallback PDF failed: {e}", file=sys.stderr)
        # Last resort: write empty file
        with open(output_path, "wb") as f:
            f.write(b"%PDF-1.4\n")

if __name__ == "__main__":
    if len(sys.argv) >= 4:
        data = json.loads(sys.argv[1])
        client = {**EMPTY_CLIENT, **data}
        fill_imm5476(client, sys.argv[2], sys.argv[3])
    else:
        print(json.dumps(EMPTY_CLIENT))
