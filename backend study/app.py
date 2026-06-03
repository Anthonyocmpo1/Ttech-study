from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.utils import secure_filename
import os, hmac, uuid

app = Flask(__name__)
CORS(app)

# ── Config ────────────────────────────────────────────────────────────────────
basedir = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(basedir, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "pdf"}
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'studymate.db')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-this-in-production")
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

db = SQLAlchemy(app)
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Ocmpo@12")


# ── Models ────────────────────────────────────────────────────────────────────
class Assignment(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    ref         = db.Column(db.String(12),  unique=True, nullable=False)
    name        = db.Column(db.String(100), nullable=False)
    phone       = db.Column(db.String(30),  nullable=False)
    campus      = db.Column(db.String(50))
    subject     = db.Column(db.String(80),  nullable=False)
    question    = db.Column(db.Text,        nullable=False)
    urgency     = db.Column(db.String(20))
    budget      = db.Column(db.String(20))
    file_name   = db.Column(db.String(255))
    file_path   = db.Column(db.String(255))
    file_type   = db.Column(db.String(10))
    status      = db.Column(db.String(20),  default="new")
    admin_reply = db.Column(db.Text)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    # FIX: set updated_at on insert too, not just on update
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "ref": self.ref, "name": self.name,
            "phone": self.phone, "campus": self.campus, "subject": self.subject,
            "question": self.question, "urgency": self.urgency, "budget": self.budget,
            "file_name": self.file_name, "file_path": self.file_path,
            "file_type": self.file_type, "has_file": bool(self.file_path),
            "status": self.status, "admin_reply": self.admin_reply,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Payment(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignment.id"), nullable=False)
    amount        = db.Column(db.Float, nullable=False)
    method        = db.Column(db.String(30))
    status        = db.Column(db.String(20), default="pending")
    notes         = db.Column(db.String(200))
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "assignment_id": self.assignment_id,
            "amount": self.amount, "method": self.method,
            "status": self.status, "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TutorialRequest(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    phone       = db.Column(db.String(30),  nullable=False)
    campus      = db.Column(db.String(50))
    req_type    = db.Column(db.String(30))
    subject     = db.Column(db.String(100))
    description = db.Column(db.Text)
    status      = db.Column(db.String(20), default="new")
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "phone": self.phone,
            "campus": self.campus, "req_type": self.req_type,
            "subject": self.subject, "description": self.description,
            "status": self.status, "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_ref():
    import random, string
    return "SM-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

def check_admin(req):
    return hmac.compare_digest(req.headers.get("X-Admin-Password", ""), ADMIN_PASSWORD)

def require_admin(fn):
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not check_admin(request):
            return jsonify({"error": "Unauthorized"}), 401
        return fn(*args, **kwargs)
    return wrapper


# ── Public Routes ─────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})


@app.route("/api/assignments", methods=["POST"])
def submit_assignment():
    if request.content_type and "multipart/form-data" in request.content_type:
        data = request.form
    else:
        data = request.get_json() or {}

    for field in ["name", "phone", "subject", "question"]:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    ref = generate_ref()
    while Assignment.query.filter_by(ref=ref).first():
        ref = generate_ref()

    file_name = file_stored = file_type = None
    uploaded = request.files.get("file")
    if uploaded and uploaded.filename:
        if not allowed_file(uploaded.filename):
            return jsonify({"error": "File type not allowed."}), 400
        ext = uploaded.filename.rsplit(".", 1)[1].lower()
        file_name = secure_filename(uploaded.filename)
        stored = f"{ref}_{uuid.uuid4().hex[:8]}.{ext}"
        uploaded.save(os.path.join(UPLOAD_FOLDER, stored))
        file_stored = stored
        file_type = "pdf" if ext == "pdf" else "image"

    now = datetime.utcnow()
    a = Assignment(
        ref=ref, name=data["name"].strip(), phone=data["phone"].strip(),
        campus=data.get("campus", ""), subject=data["subject"].strip(),
        question=data["question"].strip(), urgency=data.get("urgency", ""),
        budget=data.get("budget", ""), file_name=file_name,
        file_path=file_stored, file_type=file_type,
        # FIX: explicitly set both timestamps on creation
        created_at=now, updated_at=now,
    )
    db.session.add(a)
    db.session.commit()

    wa_msg = (f"New assignment from {a.name}%0ASubject: {a.subject}%0A"
              f"Urgency: {a.urgency}%0ABudget: {a.budget}%0ARef: {a.ref}")
    wa_link = f"https://wa.me/{os.getenv('ADMIN_WA', '264814452481')}?text={wa_msg}"
    return jsonify({"ref": ref, "wa_link": wa_link}), 201


@app.route("/api/assignments/<ref>/status")
def get_status(ref):
    a = Assignment.query.filter_by(ref=ref).first_or_404()
    return jsonify({"ref": a.ref, "status": a.status, "reply": a.admin_reply})


@app.route("/api/tutorial-requests", methods=["POST"])
def submit_tutorial_request():
    data = request.get_json() or {}
    for field in ["name", "phone", "subject"]:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400
    t = TutorialRequest(
        name        = data["name"].strip(),
        phone       = data["phone"].strip(),
        campus      = data.get("campus", ""),
        req_type    = data.get("req_type", "Tutorial"),
        subject     = data["subject"].strip(),
        description = data.get("description", ""),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify({"ok": True, "id": t.id}), 201


# ── Admin: serve files ────────────────────────────────────────────────────────
@app.route("/api/admin/files/<filename>")
def serve_file(filename):
    pw_header = request.headers.get("X-Admin-Password", "")
    pw_query  = request.args.get("pw", "")
    if not (hmac.compare_digest(pw_header, ADMIN_PASSWORD) or
            hmac.compare_digest(pw_query, ADMIN_PASSWORD)):
        return jsonify({"error": "Unauthorized"}), 401
    return send_from_directory(UPLOAD_FOLDER, filename)


# ── Admin Routes ──────────────────────────────────────────────────────────────
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    if hmac.compare_digest(data.get("password", ""), ADMIN_PASSWORD):
        return jsonify({"ok": True})
    return jsonify({"error": "Wrong password"}), 401


# FIX: removed the ?status= server-side filter entirely.
# The endpoint now always returns ALL assignments.
# Filter by status in your frontend UI instead.
@app.route("/api/admin/assignments")
@require_admin
def admin_list():
    items = Assignment.query.order_by(Assignment.created_at.desc()).all()
    return jsonify({
        "assignments": [a.to_dict() for a in items],
        "stats": {
            "total": Assignment.query.count(),
            "new":   Assignment.query.filter_by(status="new").count(),
            "done":  Assignment.query.filter_by(status="done").count(),
            "paid":  Assignment.query.filter_by(status="paid").count(),
        }
    })


@app.route("/api/admin/assignments/<int:aid>", methods=["PATCH"])
@require_admin
def admin_update(aid):
    a = Assignment.query.get_or_404(aid)
    data = request.get_json()
    if "status"      in data: a.status      = data["status"]
    if "admin_reply" in data: a.admin_reply = data["admin_reply"]
    a.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(a.to_dict())


@app.route("/api/admin/payments", methods=["POST"])
@require_admin
def add_payment():
    data = request.get_json()
    p = Payment(
        assignment_id=data["assignment_id"], amount=data["amount"],
        method=data.get("method", "MobileMoney"),
        status=data.get("status", "confirmed"), notes=data.get("notes", "")
    )
    db.session.add(p)
    a = Assignment.query.get(data["assignment_id"])
    if a: a.status = "paid"
    db.session.commit()
    return jsonify(p.to_dict()), 201


@app.route("/api/admin/payments")
@require_admin
def list_payments():
    payments = Payment.query.order_by(Payment.created_at.desc()).all()
    total = db.session.query(db.func.sum(Payment.amount)).filter_by(status="confirmed").scalar() or 0
    return jsonify({"payments": [p.to_dict() for p in payments], "total_revenue": total})


@app.route("/api/admin/tutorial-requests")
@require_admin
def admin_tutorial_requests():
    items = TutorialRequest.query.order_by(TutorialRequest.created_at.desc()).all()
    return jsonify({
        "requests": [t.to_dict() for t in items],
        "total": TutorialRequest.query.count(),
        "new": TutorialRequest.query.filter_by(status="new").count(),
    })


@app.route("/api/admin/tutorial-requests/<int:tid>", methods=["PATCH"])
@require_admin
def admin_update_tutorial(tid):
    t = TutorialRequest.query.get_or_404(tid)
    data = request.get_json()
    if "status" in data: t.status = data["status"]
    db.session.commit()
    return jsonify(t.to_dict())


# ── Init ──────────────────────────────────────────────────────────────────────
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5000)