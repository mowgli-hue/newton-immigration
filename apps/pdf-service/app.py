from flask import Flask, request, send_file, jsonify
import sys, os, tempfile

app = Flask(__name__)
sys.path.insert(0, "/app/python")

@app.route("/health", methods=["GET"])
def health():
    import pypdf, sys
    try:
        import cryptography
        cv = cryptography.__version__
    except:
        cv = "not installed"
    return jsonify({"ok": True, "pypdf": pypdf.__version__, "python": sys.version, "cryptography": cv})

@app.route("/fill", methods=["POST"])
def fill():
    body = request.get_json()
    form_id = body.get("formId", "imm5710")
    data = body.get("data", {})
    blank = f"/app/python/blank_{form_id}.pdf"
    if not os.path.exists(blank):
        return jsonify({"error": f"blank_{form_id}.pdf not found"}), 404
    out = tempfile.mktemp(suffix=".pdf")
    try:
        if form_id == "imm5710":
            from fill_imm5710 import fill_imm5710, EMPTY_CLIENT
            fill_imm5710({**EMPTY_CLIENT, **data}, blank, out)
        elif form_id == "imm5708":
            from fill_imm5708 import fill_imm5708, EMPTY_CLIENT
            fill_imm5708({**EMPTY_CLIENT, **data}, blank, out)
        elif form_id == "imm5709":
            from fill_imm5709 import fill_imm5709, EMPTY_CLIENT
            fill_imm5709({**EMPTY_CLIENT, **data}, blank, out)
        elif form_id == "imm5257":
            from fill_imm5257 import fill_imm5257, EMPTY_CLIENT
            fill_imm5257({**EMPTY_CLIENT, **data}, blank, out)
        return send_file(out, mimetype="application/pdf")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/debug", methods=["GET"])
def debug():
    import sys
    sys.path.insert(0, "/app/python")
    from pypdf import PdfReader, PdfWriter
    import xml.etree.ElementTree as ET
    reader = PdfReader("/app/python/blank_imm5710.pdf")
    xfa_list = list(reader.trailer["/Root"]["/AcroForm"]["/XFA"])
    for i in range(0, len(xfa_list), 2):
        if str(xfa_list[i]) == "datasets":
            ds = xfa_list[i+1].get_object()
            xml = ds.get_data().decode("utf-8")
            # inject test data
            xml = xml.replace("<FamilyName/>", "<FamilyName>TESTNAME</FamilyName>")
            ds.set_data(xml.encode("utf-8"))
            import tempfile
            out = tempfile.mktemp(suffix=".pdf")
            w = PdfWriter()
            w.append(reader)
            with open(out, "wb") as f: w.write(f)
            # read back
            r2 = PdfReader(out)
            xfa2 = list(r2.trailer["/Root"]["/AcroForm"]["/XFA"])
            for j in range(0, len(xfa2), 2):
                if str(xfa2[j]) == "datasets":
                    ds2 = xfa2[j+1].get_object()
                    xml2 = ds2.get_data().decode("utf-8")
                    has_test = "TESTNAME" in xml2
                    return jsonify({"injected": has_test, "xml_snippet": xml2[xml2.find("FamilyName")-5:xml2.find("FamilyName")+40]})
    return jsonify({"error": "datasets not found"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
