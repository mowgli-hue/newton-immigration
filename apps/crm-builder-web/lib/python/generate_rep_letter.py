"""
generate_rep_letter.py
Newton Immigration — Representative Submission Letter
Auto-generates on Newton letterhead for each client
"""
import sys
import json
from datetime import datetime

RCIC_NAME = "Navdeep Singh Sandhu"
RCIC_NUMBER = "R-705964"
RCIC_COMPANY = "Newton Immigration Inc."
RCIC_ADDRESS = "Suite 300, 9850 King George Blvd, Surrey BC V3T 0P9"
RCIC_EMAIL = "newtonimmigration@gmail.com"
RCIC_PHONE = "+1 778-723-6662"
RCIC_WEBSITE = "www.newtonimmigration.ca"

def generate_rep_letter(client_data: dict, output_path: str):
    """Generate Newton Immigration Representative Letter as PDF"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

        client_name = client_data.get("client_name", "")
        form_type = client_data.get("form_type", "PGWP")
        passport_no = client_data.get("passport_number", "[Passport Number]")
        arrival_date = client_data.get("arrival_date", "[Date of Entry]")
        institution = client_data.get("institution", "[Institution Name]")
        program = client_data.get("program", "[Program of Study]")
        uci = client_data.get("uci", "")
        today = datetime.now().strftime("%B %d, %Y")

        # Build docs list from checklist
        docs = client_data.get("documents_list", [
            "IMM 5710 – Application to Change Conditions or Extend Stay in Canada (Worker)",
            "IMM 5476 – Use of a Representative",
            "Passport (bio page + all relevant pages)",
            "Current Study Permit",
            "Program Completion Letter",
            "Official Academic Transcripts",
            "Language Test Results",
            "Digital Photograph",
        ])

        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            leftMargin=1*inch,
            rightMargin=1*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        styles = getSampleStyleSheet()

        # Custom styles
        header_style = ParagraphStyle('Header', fontSize=20, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a1a2e'), alignment=TA_CENTER, spaceAfter=2)
        subheader_style = ParagraphStyle('SubHeader', fontSize=9, fontName='Helvetica', textColor=colors.HexColor('#666666'), alignment=TA_CENTER, spaceAfter=4)
        body_style = ParagraphStyle('Body', fontSize=10.5, fontName='Helvetica', leading=16, spaceAfter=8, alignment=TA_JUSTIFY)
        bold_style = ParagraphStyle('Bold', fontSize=10.5, fontName='Helvetica-Bold', leading=16, spaceAfter=8)
        small_style = ParagraphStyle('Small', fontSize=9, fontName='Helvetica', textColor=colors.HexColor('#444444'))
        footer_style = ParagraphStyle('Footer', fontSize=8, fontName='Helvetica', textColor=colors.HexColor('#888888'), alignment=TA_CENTER)

        elements = []

        # Header — Newton Immigration letterhead
        elements.append(Paragraph("NEWTON IMMIGRATION INC.", header_style))
        elements.append(Paragraph(f"{RCIC_NAME}  •  RCIC {RCIC_NUMBER}  •  Regulated Canadian Immigration Consultant", subheader_style))
        elements.append(Paragraph(f"{RCIC_ADDRESS}  •  {RCIC_EMAIL}  •  {RCIC_PHONE}", subheader_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1a1a2e'), spaceAfter=12))

        # Date
        elements.append(Paragraph(today, body_style))
        elements.append(Spacer(1, 0.1*inch))

        # To
        elements.append(Paragraph("To:", bold_style))
        elements.append(Paragraph("Immigration, Refugees and Citizenship Canada (IRCC)", body_style))
        elements.append(Spacer(1, 0.1*inch))

        # Subject
        app_type_full = {
            "pgwp": "Post-Graduation Work Permit (PGWP)",
            "sowp": "Spousal Open Work Permit (SOWP)",
            "bowp": "Bridging Open Work Permit (BOWP)",
            "study permit": "Study Permit",
            "visitor visa": "Temporary Resident Visa (Visitor Visa)",
            "super visa": "Super Visa",
        }.get(form_type.lower(), form_type)

        elements.append(Paragraph(f"<b>Re: Support Letter for {client_name}'s {app_type_full} Application</b>", bold_style))
        if passport_no:
            elements.append(Paragraph(f"Passport: {passport_no}{f'  •  UCI: {uci}' if uci else ''}", small_style))
        elements.append(Spacer(1, 0.15*inch))

        # Opening
        elements.append(Paragraph(
            f"Dear Immigration Officer,",
            body_style
        ))
        elements.append(Paragraph(
            f"I am writing in my capacity as a Regulated Canadian Immigration Consultant (RCIC {RCIC_NUMBER}), "
            f"authorized member of the College of Immigration and Citizenship Consultants (CICC), on behalf of "
            f"my client <b>{client_name}</b>, in support of their application for a <b>{app_type_full}</b>.",
            body_style
        ))

        # Client background
        if form_type.lower() in ["pgwp"]:
            elements.append(Paragraph(
                f"{client_name} first entered Canada on <b>{arrival_date}</b> for the purpose of pursuing post-secondary "
                f"education. They successfully completed their program of study at <b>{institution}</b>"
                f"{f' ({program})' if program and program != '[Program of Study]' else ''} and are now eligible "
                f"to apply for a Post-Graduation Work Permit under IRCC regulations.",
                body_style
            ))
            elements.append(Paragraph(
                f"My client meets all eligibility requirements for the PGWP, including:",
                body_style
            ))
            for point in [
                "Successful completion of an eligible program of study at a PGWP-eligible DLI",
                "Valid study permit at the time of application",
                "Full-time enrollment throughout the program",
                "Meeting the minimum language proficiency requirements",
            ]:
                elements.append(Paragraph(f"• {point}", ParagraphStyle('Bullet', parent=body_style, leftIndent=20, spaceAfter=4)))
        else:
            elements.append(Paragraph(
                f"{client_name} is applying for a {app_type_full}. As their authorized representative, "
                f"I have reviewed all documentation and confirm that my client meets all applicable eligibility "
                f"requirements under the Immigration and Refugee Protection Act (IRPA) and associated regulations.",
                body_style
            ))

        elements.append(Spacer(1, 0.1*inch))

        # Documents list
        elements.append(Paragraph("<b>Enclosed Documents:</b>", bold_style))
        for i, doc_item in enumerate(docs, 1):
            elements.append(Paragraph(f"{i}. {doc_item}", ParagraphStyle('DocItem', parent=body_style, leftIndent=20, spaceAfter=3)))

        elements.append(Spacer(1, 0.1*inch))

        # Closing
        elements.append(Paragraph(
            "I respectfully request that this application receive your prompt and favourable consideration. "
            "Should you require any additional information or documentation, please do not hesitate to contact "
            "our office directly.",
            body_style
        ))
        elements.append(Spacer(1, 0.2*inch))

        # Signature block
        elements.append(Paragraph("Sincerely,", body_style))
        elements.append(Spacer(1, 0.4*inch))
        elements.append(Paragraph(f"<b>{RCIC_NAME}</b>", bold_style))
        elements.append(Paragraph(f"RCIC {RCIC_NUMBER}", small_style))
        elements.append(Paragraph(RCIC_COMPANY, small_style))
        elements.append(Paragraph(RCIC_ADDRESS, small_style))
        elements.append(Paragraph(f"{RCIC_EMAIL}  •  {RCIC_PHONE}", small_style))

        elements.append(Spacer(1, 0.3*inch))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc'), spaceAfter=6))
        elements.append(Paragraph(f"{RCIC_COMPANY}  •  {RCIC_NAME}, RCIC {RCIC_NUMBER}  •  {RCIC_ADDRESS}", footer_style))
        elements.append(Paragraph(f"{RCIC_EMAIL}  •  {RCIC_PHONE}  •  Internal use only", footer_style))

        doc.build(elements)
        print(f"Representative letter generated: {output_path}")
        return True

    except Exception as e:
        print(f"Error generating rep letter: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        data = json.loads(sys.argv[1])
        generate_rep_letter(data, sys.argv[2])
    else:
        print("Usage: python3 generate_rep_letter.py '<json>' output.pdf")
