"""
Maps CRM intake fields → IMM form fields
Keys match exactly what the client portal questionnaire collects
"""

def _phone_parts(phone: str):
    digits = "".join(c for c in str(phone or "").replace("+1","") if c.isdigit())
    if len(digits) == 11: digits = digits[1:]
    return digits[:3], digits[3:6], digits[6:11] if len(digits) >= 10 else ("","","")

def _parse_date(d: str):
    parts = str(d or "").split("-")
    if len(parts) == 3:
        return parts[0], parts[1], parts[2]
    return "", "", ""

def _bool(v):
    return str(v).lower() in ("true","yes","1")

def map_intake_to_imm5710(intake: dict, case: dict) -> dict:
    from fill_imm5710 import EMPTY_CLIENT
    client = {**EMPTY_CLIENT}

    # Name from case
    full = str(case.get("client","")).strip()
    parts = full.split(" ", 1)
    client["given_name"] = parts[0] if parts else ""
    client["family_name"] = parts[1] if len(parts) > 1 else ""

    # Contact from case
    phone = str(case.get("leadPhone","")).replace("+1","")
    area, first3, last5 = _phone_parts(phone)
    client["phone_area_code"] = area
    client["phone_first_three"] = first3
    client["phone_last_five"] = last5
    client["email"] = str(case.get("leadEmail",""))

    # Personal from intake (direct key mapping)
    client["sex"] = intake.get("sex","")
    dob_y, dob_m, dob_d = _parse_date(intake.get("dob",""))
    client["dob_year"] = dob_y
    client["dob_month"] = dob_m
    client["dob_day"] = dob_d
    client["place_birth_city"] = intake.get("place_birth_city","")
    client["place_birth_country"] = intake.get("place_birth_country","")
    client["citizenship_country"] = intake.get("citizenship_country","")
    client["native_language"] = intake.get("native_language","")
    client["communicate_language"] = "English"

    # Address
    client["mailing_street_num"] = intake.get("mailing_street_num","")
    client["mailing_street_name"] = intake.get("mailing_street_name","")
    client["mailing_apt_unit"] = intake.get("mailing_apt_unit","")
    client["mailing_city"] = intake.get("mailing_city","")
    client["mailing_province"] = intake.get("mailing_province","")
    client["mailing_postal_code"] = intake.get("mailing_postal_code","")
    client["mailing_country"] = "Canada"

    # Status
    client["current_status"] = intake.get("current_status","")
    client["current_status_from_date"] = intake.get("current_status_from_date","")
    client["current_status_to_date"] = intake.get("current_status_to_date","")
    client["original_entry_date"] = intake.get("original_entry_date","")
    client["original_entry_place"] = intake.get("original_entry_place","")
    client["recent_entry_date"] = intake.get("recent_entry_date","")
    client["recent_entry_place"] = intake.get("recent_entry_place","")

    # Marital
    client["marital_status"] = intake.get("marital_status","Single")
    if intake.get("marital_status") in ("Married","Common-Law"):
        client["spouse_family_name"] = intake.get("spouse_family_name","")
        client["spouse_given_name"] = intake.get("spouse_given_name","")
        client["date_of_marriage"] = intake.get("date_of_marriage","")

    # Background
    client["prev_application_refused"] = _bool(intake.get("prev_application_refused",False))
    client["has_criminal_record"] = _bool(intake.get("has_criminal_record",False))
    client["has_medical_condition"] = _bool(intake.get("has_medical_condition",False))
    client["has_military_service"] = _bool(intake.get("has_military_service",False))

    # Employment history — dynamic entries (emp1_, emp2_, emp3_... up to empCount)
    emp_list = []
    emp_count = int(intake.get("__empCount", "10"))
    for i in range(1, emp_count + 1):
        title = intake.get(f"emp{i}_title","")
        employer = intake.get(f"emp{i}_employer","")
        if not title and not employer:
            continue
        from_d = str(intake.get(f"emp{i}_from",""))
        to_d = str(intake.get(f"emp{i}_to",""))
        from_parts = from_d.split("-") if "-" in from_d else ["","",""]
        to_parts = to_d.split("-") if "-" in to_d else ["","",""]
        emp_list.append({
            "occupation": title,
            "employer": employer,
            "city": intake.get(f"emp{i}_city",""),
            "country": intake.get(f"emp{i}_country","Canada"),
            "prov_state": intake.get("mailing_province","BC"),
            "from_year": from_parts[0],
            "from_month": from_parts[1] if len(from_parts)>1 else "",
            "to_year": to_parts[0],
            "to_month": to_parts[1] if len(to_parts)>1 else "",
        })
    if emp_list:
        client["employment"] = emp_list[:3]  # IMM5710 max 3

    # Education
    if intake.get("edu_school_name"):
        client["has_education"] = True
        client["edu_school_name"] = intake.get("edu_school_name","")
        client["edu_field_of_study"] = intake.get("edu_field_of_study","")
        client["edu_city"] = intake.get("edu_city","")
        client["edu_country"] = "Canada"
        client["edu_from_year"] = intake.get("edu_from_year","")
        client["edu_to_year"] = intake.get("edu_to_year","")

    # Application type
    form_type = str(case.get("formType","")).lower()
    client["applying_extend_stay"] = any(x in form_type for x in ["pgwp","work permit","sowp","bowp","open work","lmia"])
    client["applying_restore_status"] = "restoration" in form_type

    return client


def map_intake_to_imm5709(intake: dict, case: dict) -> dict:
    from fill_imm5709 import EMPTY_CLIENT
    base = map_intake_to_imm5710(intake, case)
    client = {**EMPTY_CLIENT}
    for k in EMPTY_CLIENT:
        if k in base and base[k]:
            client[k] = base[k]
    client["applying_extend_stay"] = True
    return client


def map_intake_to_imm5708(intake: dict, case: dict) -> dict:
    from fill_imm5708 import EMPTY_CLIENT
    base = map_intake_to_imm5710(intake, case)
    client = {**EMPTY_CLIENT}
    for k in EMPTY_CLIENT:
        if k in base and base[k]:
            client[k] = base[k]
    client["applying_extend_stay"] = True
    return client


def map_intake_to_imm5257(intake: dict, case: dict) -> dict:
    from fill_imm5257 import EMPTY_CLIENT
    base = map_intake_to_imm5710(intake, case)
    client = {**EMPTY_CLIENT}
    for k in EMPTY_CLIENT:
        if k in base and base[k]:
            client[k] = base[k]
    return client


FORM_MAP = {
    "post-graduation work permit": ["imm5710"],
    "pgwp": ["imm5710"],
    "spousal open work permit": ["imm5710"],
    "sowp": ["imm5710"],
    "bridging open work permit": ["imm5710"],
    "bowp": ["imm5710"],
    "open work permit": ["imm5710"],
    "lmia-based work permit": ["imm5710"],
    "lmia-exempt work permit": ["imm5710"],
    "vulnerable open work permit": ["imm5710"],
    "visitor record": ["imm5708"],
    "visitor visa": ["imm5257"],
    "trv": ["imm5257"],
    "study permit": ["imm5709"],
    "study permit extension": ["imm5709"],
    "restoration": ["imm5710"],
}

def get_forms_for_case(form_type: str) -> list:
    ft = form_type.lower().strip()
    for key, forms in FORM_MAP.items():
        if key in ft or ft in key:
            return forms
    return []
