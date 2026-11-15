"""Push the App Store listing TEXTS to App Store Connect (idempotent), then read them back and compare.

What it sets, for every locale in appstore/metadata.json:
  app info:  name, subtitle, privacy policy URL
  version:   description, keywords, promotional text, what's new, support URL, marketing URL
and once: primary category Productivity, age rating answers (4+), copyright.
It never uploads screenshots or previews, never attaches a build and never submits for review.

   ~/.appstoreconnect/venv/bin/python tools/asc_metadata.py [--verify] [locale ...]   (from ios/)
   --verify  only read back and compare, change nothing."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from asc_client import call, get_all, APIError

APP_ID = "6790191994"   # com.ilyapasyuk.wunderrip
VERSION = "1.0"
SITE = "https://notes.pasyuk.com"
PRIVACY, SUPPORT, MARKETING = f"{SITE}/privacy", f"{SITE}/support", f"{SITE}/ios"
COPYRIGHT = "2026 Ilya Pasyuk"
META = json.load(open(os.path.join(HERE, "..", "appstore", "metadata.json")))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
LOCALES = args or list(META)
VERIFY_ONLY = "--verify" in sys.argv
LIMITS = {"name": 30, "subtitle": 30, "keywords": 100, "promo": 170, "description": 4000, "whatsNew": 4000}

# Age rating: a to-do app. No ads, no web browser, no chat, nothing objectionable. Tasks are private to their
# owner (isPublic is always false; there is no public sharing), so no user-generated content is shown to others.
AGE = {
    "advertising": False, "ageAssurance": False, "gambling": False, "healthOrWellnessTopics": False,
    "lootBox": False, "messagingAndChat": False, "parentalControls": False, "socialMedia": False,
    "unrestrictedWebAccess": False, "userGeneratedContent": False,
    **{k: "NONE" for k in (
        "alcoholTobaccoOrDrugUseOrReferences", "contests", "gamblingSimulated", "gunsOrOtherWeapons",
        "horrorOrFearThemes", "matureOrSuggestiveThemes", "medicalOrTreatmentInformation",
        "profanityOrCrudeHumor", "sexualContentGraphicAndNudity", "sexualContentOrNudity",
        "violenceCartoonOrFantasy", "violenceRealistic", "violenceRealisticProlongedGraphicOrSadistic")},
}

for loc in LOCALES:
    for k, n in LIMITS.items():
        assert len(META[loc][k]) <= n, f"{loc}.{k} too long: {len(META[loc][k])}"
    assert ", " not in META[loc]["keywords"], f"{loc}.keywords: no spaces after commas"

info = [i for i in get_all(f"/v1/apps/{APP_ID}/appInfos")
        if (i["attributes"].get("state") or i["attributes"].get("appStoreState")) != "READY_FOR_DISTRIBUTION"][0]
EDITABLE = ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED")
ver = [v for v in get_all(f"/v1/apps/{APP_ID}/appStoreVersions")
       if v["attributes"]["platform"] == "IOS" and v["attributes"]["appStoreState"] in EDITABLE][0]
skipped_whats_new = False


def push():
    global skipped_whats_new
    # --- category + age rating
    call("PATCH", f"/v1/appInfos/{info['id']}", {"data": {"type": "appInfos", "id": info["id"], "relationships": {
        "primaryCategory": {"data": {"type": "appCategories", "id": "PRODUCTIVITY"}}}}})
    print("✓ primary category: Productivity")
    decl = call("GET", f"/v1/appInfos/{info['id']}/ageRatingDeclaration")["data"]
    call("PATCH", f"/v1/ageRatingDeclarations/{decl['id']}",
         {"data": {"type": "ageRatingDeclarations", "id": decl["id"], "attributes": AGE}})
    print("✓ age rating: nothing objectionable, no ads, no UGC, no web access")

    # --- app info localizations
    existing = {l["attributes"]["locale"]: l for l in get_all(f"/v1/appInfos/{info['id']}/appInfoLocalizations")}
    for loc in LOCALES:
        d = META[loc]
        attrs = {"name": d["name"], "subtitle": d["subtitle"], "privacyPolicyUrl": PRIVACY}
        try:
            if loc in existing:
                call("PATCH", f"/v1/appInfoLocalizations/{existing[loc]['id']}",
                     {"data": {"type": "appInfoLocalizations", "id": existing[loc]["id"], "attributes": attrs}})
            else:
                call("POST", "/v1/appInfoLocalizations", {"data": {"type": "appInfoLocalizations",
                     "attributes": dict(attrs, locale=loc),
                     "relationships": {"appInfo": {"data": {"type": "appInfos", "id": info["id"]}}}}})
            print(f"✓ [{loc}] {d['name']} — {d['subtitle']}")
        except APIError as e:
            print(f"! [{loc}] name/subtitle:", str(e)[:400])

    # --- version texts
    call("PATCH", f"/v1/appStoreVersions/{ver['id']}", {"data": {"type": "appStoreVersions", "id": ver["id"],
         "attributes": {"copyright": COPYRIGHT}}})
    existing = {l["attributes"]["locale"]: l for l in get_all(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations")}
    for loc in LOCALES:
        d = META[loc]
        attrs = {"description": d["description"], "keywords": d["keywords"], "promotionalText": d["promo"],
                 "whatsNew": d["whatsNew"], "supportUrl": SUPPORT, "marketingUrl": MARKETING}
        for attempt in (1, 2):
            try:
                if loc in existing:
                    call("PATCH", f"/v1/appStoreVersionLocalizations/{existing[loc]['id']}",
                         {"data": {"type": "appStoreVersionLocalizations", "id": existing[loc]["id"], "attributes": attrs}})
                else:
                    call("POST", "/v1/appStoreVersionLocalizations", {"data": {"type": "appStoreVersionLocalizations",
                         "attributes": dict(attrs, locale=loc),
                         "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": ver["id"]}}}}})
                break
            except APIError as e:
                # The first version of an app has no "What's New"; App Store Connect rejects the field.
                if attempt == 1 and "whatsNew" in str(e):
                    attrs.pop("whatsNew"); skipped_whats_new = True; continue
                raise
        print(f"✓ [{loc}] description {len(d['description'])}, keywords {len(d['keywords'])}, promo"
              + ("" if "whatsNew" not in attrs else ", what's new"))


def verify():
    problems = []
    infos = {l["attributes"]["locale"]: l["attributes"] for l in get_all(f"/v1/appInfos/{info['id']}/appInfoLocalizations")}
    vers = {l["attributes"]["locale"]: l["attributes"] for l in get_all(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations")}
    for loc in LOCALES:
        d, a, v = META[loc], infos.get(loc, {}), vers.get(loc, {})
        want = [("name", a.get("name"), d["name"]), ("subtitle", a.get("subtitle"), d["subtitle"]),
                ("privacyPolicyUrl", a.get("privacyPolicyUrl"), PRIVACY),
                ("description", v.get("description"), d["description"]), ("keywords", v.get("keywords"), d["keywords"]),
                ("promotionalText", v.get("promotionalText"), d["promo"]),
                ("supportUrl", v.get("supportUrl"), SUPPORT), ("marketingUrl", v.get("marketingUrl"), MARKETING)]
        if not skipped_whats_new and v.get("whatsNew") is not None:
            want.append(("whatsNew", v.get("whatsNew"), d["whatsNew"]))
        bad = [k for k, got, exp in want if (got or "").replace("\r\n", "\n") != exp]
        if bad:
            problems.append((loc, bad))
        print(("✓" if not bad else "✗"), f"[{loc}]", "matches" if not bad else f"differs: {bad}",
              "" if v.get("whatsNew") else "(no what's new stored)")
    cat = call("GET", f"/v1/appInfos/{info['id']}/primaryCategory").get("data") or {}
    decl = call("GET", f"/v1/appInfos/{info['id']}/ageRatingDeclaration")["data"]["attributes"]
    age_bad = [k for k, x in AGE.items() if decl.get(k) != x]
    print("primary category:", cat.get("id"), "| age rating mismatches:", age_bad or "none")
    return problems or age_bad or cat.get("id") != "PRODUCTIVITY"


if not VERIFY_ONLY:
    push()
print("--- read back")
sys.exit(1 if verify() else 0)
