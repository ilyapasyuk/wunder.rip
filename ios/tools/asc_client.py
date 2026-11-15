"""Minimal App Store Connect API client. Credentials live outside the repo:
~/.appstoreconnect/config.json  {"issuer_id", "key_id", "app_id"}
~/.appstoreconnect/private_keys/AuthKey_<key_id>.p8
Run with ~/.appstoreconnect/venv/bin/python (pyjwt, cryptography, requests)."""
import json, os, time, warnings
warnings.filterwarnings("ignore")
import jwt, requests

HOME = os.path.expanduser("~/.appstoreconnect")
CFG = json.load(open(f"{HOME}/config.json"))
KEY = open(f"{HOME}/private_keys/AuthKey_{CFG['key_id']}.p8").read()
BASE = "https://api.appstoreconnect.apple.com"
_tok = {"v": None, "exp": 0}

def token():
    if time.time() > _tok["exp"] - 60:
        exp = int(time.time()) + 1100
        _tok["v"] = jwt.encode({"iss": CFG["issuer_id"], "iat": int(time.time()), "exp": exp, "aud": "appstoreconnect-v1"},
                               KEY, algorithm="ES256", headers={"kid": CFG["key_id"], "typ": "JWT"})
        _tok["exp"] = exp
    return _tok["v"]

class APIError(Exception): pass

def call(method, path, body=None, params=None, ok=(200, 201, 204)):
    url = path if path.startswith("http") else BASE + path
    for attempt in range(8):
        r = requests.request(method, url, params=params, json=body,
                             headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"}, timeout=60)
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(min(60, 2 ** attempt * 2)); continue   # 2, 4, 8 … 60 s: parallel uploads hit 429s
        break
    if r.status_code not in ok:
        raise APIError(f"{method} {path} -> {r.status_code}: {r.text[:800]}")
    return r.json() if r.text else {}

def get_all(path, params=None):
    out, url, p = [], path, dict(params or {}, limit=200)
    while url:
        d = call("GET", url, params=p); out += d.get("data", [])
        url, p = d.get("links", {}).get("next"), None
    return out

