"""Respaldo semanal de la base de datos (Firestore) — solo lectura.
Necesita dos secretos del repositorio: FIREBASE_SA_JSON (cuenta de servicio con rol «Cloud Datastore Viewer»)
y BACKUP_PASSPHRASE (frase para cifrar el respaldo). Los proyectos ya están cifrados por la app; además el archivo
completo se cifra con AES-256 antes de guardarse como artefacto (90 días)."""
import json, os, sys, time, urllib.request, urllib.error
from google.oauth2 import service_account
from google.auth.transport.requests import Request
sa = json.loads(os.environ["FIREBASE_SA_JSON"])
cred = service_account.Credentials.from_service_account_info(sa, scopes=["https://www.googleapis.com/auth/datastore"]); cred.refresh(Request())
pid = sa["project_id"]; BASE = f"https://firestore.googleapis.com/v1/projects/{pid}/databases/(default)/documents"
def call(url, body=None):
    for a in range(5):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method="POST" if body is not None else "GET",
                                         headers={"Authorization": "Bearer " + cred.token, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and a < 4: time.sleep(2 ** a); continue
            raise
def collections(parent):
    out, tok = [], None
    while True:
        j = call(f"{parent}:listCollectionIds", {"pageSize": 300, **({"pageToken": tok} if tok else {})}); out += j.get("collectionIds", []); tok = j.get("nextPageToken")
        if not tok: return out
n = 0
with open("respaldo.jsonl", "w") as f:
    def walk(parent_url, path):
        global n
        for col in collections(parent_url):
            tok = None
            while True:
                j = call(f"{BASE}/{path + '/' if path else ''}{col}?pageSize=300{'&pageToken=' + tok if tok else ''}")
                for d in j.get("documents", []):
                    f.write(json.dumps(d) + "\n"); n += 1
                    rel = d["name"].split("/documents/", 1)[1]; walk(f"{BASE}/{rel}", rel)
                tok = j.get("nextPageToken")
                if not tok: break
    walk(BASE, "")
print(f"Documentos respaldados: {n}")
