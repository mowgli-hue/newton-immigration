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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
