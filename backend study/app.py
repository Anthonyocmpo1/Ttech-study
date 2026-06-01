from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.utils import secure_filename
import os, hmac, hashlib, uuid

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Config ────────────────────────────────────────────────────────────────────
basedir = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(basedir, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'studymate.db')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-this-in-production")
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE

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
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "ref": self.ref,
            "name": self.name,
            "phone": self.phone,
            "campus": self.campus,
            "subject": self.subject,
            "question": self.question,
            "urgency": self.urgency,
            "budget": self.budget,
            "file_name": self.file_name,
            "file_path": self.file_path,
            "file_type": self.file_type,
            "has_file": bool(self.file_path),
            "status": self.status,
            "admin_reply": self.admin_reply,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
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
            "id": self.id,
            "assignment_id": self.assignment_id,
            "amount": self.amount,
            "method": self.method,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
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
            return jsonify({"error": "File type not allowed. Use JPG, PNG, PDF."}), 400
        ext = uploaded.filename.rsplit(".", 1)[1].lower()
        file_name = secure_filename(uploaded.filename)
        stored = f"{ref}_{uuid.uuid4().hex[:8]}.{ext}"
        uploaded.save(os.path.join(UPLOAD_FOLDER, stored))
        file_stored = stored
        file_type = "pdf" if ext == "pdf" else "image"

    a = Assignment(
        ref=ref,
        name=data["name"].strip(),
        phone=data["phone"].strip(),
        campus=data.get("campus", ""),
        subject=data["subject"].strip(),
        question=data["question"].strip(),
        urgency=data.get("urgency", ""),
        budget=data.get("budget", ""),
        file_name=file_name,
        file_path=file_stored,
        file_type=file_type,
    )
    db.session.add(a)
    db.session.commit()

    return jsonify({"ref": ref}), 201


@app.route("/api/assignments/<ref>/status")
def get_status(ref):
    a = Assignment.query.filter_by(ref=ref).first_or_404()
    return jsonify({"ref": a.ref, "status": a.status, "reply": a.admin_reply})


# ── Admin Routes (UNCHANGED) ────────────────────────────────────────────────
@app.route("/api/admin/assignments")
@require_admin
def admin_list():
    items = Assignment.query.order_by(Assignment.created_at.desc()).all()
    return jsonify({"assignments": [a.to_dict() for a in items]})


@app.route("/api/admin/payments", methods=["POST"])
@require_admin
def add_payment():
    data = request.get_json()
    p = Payment(
        assignment_id=data["assignment_id"],
        amount=data["amount"],
        method=data.get("method", "MobileMoney"),
        status=data.get("status", "confirmed"),
        notes=data.get("notes", "")
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


# ─────────────────────────────────────────────────────────────────────────────
# ✅ ADDED: TUTORIAL REQUEST ENDPOINT (NEW FEATURE)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/tutorial-requests", methods=["POST"])
def submit_tutorial_request():
    data = request.get_json() or {}

    # no database changes (safe simple endpoint)
    return jsonify({
        "ok": True,
        "message": "Tutorial request received",
        "data": data
    }), 201


# ── Init ─────────────────────────────────────────────────────────────────────
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5000)