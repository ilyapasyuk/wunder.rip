"""Push App Store screenshots and App Previews for the editable iOS version (idempotent).

Only media: screenshot sets (iPhone 6.9" APP_IPHONE_67, iPad 13" APP_IPAD_PRO_3GEN_129, Apple Watch Ultra
APP_WATCH_ULTRA, iPhone Duo APP_IPHONE_DUO when present) from appstore/screenshots/<locale>/, and the iPhone App Preview
(IPHONE_67) from appstore/preview/<locale>/iphone_67.mp4. A set whose files already match (same MD5s, same order, all
processed) is left alone; otherwise its contents are replaced. Never touches texts or app info, never creates
localizations (locales missing on the version are reported and skipped), never attaches builds or submits.

   ~/.appstoreconnect/venv/bin/python tools/asc_media.py [--check] [locale ...]     (run from ios/)
   --check: only print what is on App Store Connect (sets, counts, delivery state)."""
import glob, hashlib, os, sys, time
sys.path.insert(0, "tools")
import requests
from asc_client import call, get_all

APP_ID = "6790191994"   # wunder.rip
VERSION = "1.0"
SCREENSHOTS = {"iphone": "APP_IPHONE_67", "ipad": "APP_IPAD_PRO_3GEN_129", "watch": "APP_WATCH_ULTRA", "duo": "APP_IPHONE_DUO"}
PREVIEWS = {"iphone_67.mp4": "IPHONE_67"}
POSTER = "00:00:03:00"   # preview poster frame: the Today list, after the first card
DONE = ("COMPLETE", "UPLOAD_COMPLETE")

args = [a for a in sys.argv[1:] if not a.startswith("--")]
CHECK = "--check" in sys.argv

ver = [v for v in get_all(f"/v1/apps/{APP_ID}/appStoreVersions")
       if v["attributes"]["platform"] == "IOS" and v["attributes"]["versionString"] == VERSION][0]
assert ver["attributes"]["appStoreState"] in ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"), \
    f"version {VERSION} is {ver['attributes']['appStoreState']}, not editable"
locs = {l["attributes"]["locale"]: l["id"] for l in get_all(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations")}
md5 = lambda path: hashlib.md5(open(path, "rb").read()).hexdigest()


def state(asset):
    return (asset["attributes"].get("assetDeliveryState") or {}).get("state")


def upload(kind, set_type, set_id, path, extra=None):
    data = open(path, "rb").read()
    attrs = {"fileName": os.path.basename(path), "fileSize": len(data)}
    if kind == "appPreviews":
        attrs["mimeType"] = "video/mp4"
    item = call("POST", f"/v1/{kind}", {"data": {"type": kind, "attributes": attrs,
                "relationships": {set_type[:-1]: {"data": {"type": set_type, "id": set_id}}}}})["data"]
    for op in item["attributes"]["uploadOperations"]:
        requests.request(op["method"], op["url"], data=data[op["offset"]: op["offset"] + op["length"]],
                         headers={h["name"]: h["value"] for h in op["requestHeaders"]}, timeout=300).raise_for_status()
    call("PATCH", f"/v1/{kind}/{item['id']}", {"data": {"type": kind, "id": item["id"],
         "attributes": dict({"uploaded": True, "sourceFileChecksum": hashlib.md5(data).hexdigest()}, **(extra or {}))}})
    return item["id"]


def sync(loc, loc_id, kind, set_kind, type_attr, set_name, files, extra=None):
    """Make the set `set_name` of this localization hold exactly `files`, in order."""
    sets = {s["attributes"][type_attr]: s for s in get_all(f"/v1/appStoreVersionLocalizations/{loc_id}/{set_kind}")}
    s = sets.get(set_name)
    if s:
        current = get_all(f"/v1/{set_kind}/{s['id']}/{kind}")
        if [x["attributes"].get("sourceFileChecksum") for x in current] == [md5(f) for f in files] \
                and all(state(x) in DONE for x in current):
            print(f"  = [{loc}] {set_name}: {len(files)} up to date"); return
        for old in current:
            call("DELETE", f"/v1/{kind}/{old['id']}")
    else:
        s = call("POST", f"/v1/{set_kind}", {"data": {"type": set_kind, "attributes": {type_attr: set_name},
                 "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": loc_id}}}}})["data"]
    ids = [upload(kind, set_kind, s["id"], f, extra) for f in files]
    if len(ids) > 1:
        call("PATCH", f"/v1/{set_kind}/{s['id']}/relationships/{kind}", {"data": [{"type": kind, "id": i} for i in ids]})
    print(f"  ↑ [{loc}] {set_name}: {len(ids)} uploaded")


def report(only):
    bad = []
    for loc in only:
        if loc not in locs: continue
        line = []
        for s in get_all(f"/v1/appStoreVersionLocalizations/{locs[loc]}/appScreenshotSets"):
            xs = get_all(f"/v1/appScreenshotSets/{s['id']}/appScreenshots")
            states = {state(x) for x in xs}
            line.append(f"{s['attributes']['screenshotDisplayType']}={len(xs)}{'' if states <= {'COMPLETE'} else ' ' + ','.join(map(str, states))}")
            bad += [(loc, s["attributes"]["screenshotDisplayType"], state(x)) for x in xs if state(x) != "COMPLETE"]
        for p in get_all(f"/v1/appStoreVersionLocalizations/{locs[loc]}/appPreviewSets"):
            xs = get_all(f"/v1/appPreviewSets/{p['id']}/appPreviews")
            states = {state(x) for x in xs}
            line.append(f"preview {p['attributes']['previewType']}={len(xs)}{'' if states <= {'COMPLETE'} else ' ' + ','.join(map(str, states))}")
            bad += [(loc, p["attributes"]["previewType"], state(x), (x["attributes"].get("assetDeliveryState") or {}).get("errors"))
                    for x in xs if state(x) != "COMPLETE"]
        print(f"{loc:8} " + "  ".join(line))
    return bad


only = args or sorted(set(os.listdir("appstore/screenshots")) | set(os.listdir("appstore/preview")) - {"raw", "work"})
if not CHECK:
    for loc in only:
        if loc not in locs:
            print(f"– [{loc}] no localization on version {VERSION}, skipped"); continue
        for prefix, display in SCREENSHOTS.items():
            files = sorted(glob.glob(f"appstore/screenshots/{loc}/{prefix}_*.png"), key=lambda f: int(f.rsplit("_", 1)[1][:-4]))
            if files:
                sync(loc, locs[loc], "appScreenshots", "appScreenshotSets", "screenshotDisplayType", display, files)
        for name, ptype in PREVIEWS.items():
            path = f"appstore/preview/{loc}/{name}"
            if os.path.exists(path):
                sync(loc, locs[loc], "appPreviews", "appPreviewSets", "previewType", ptype, [path], {"previewFrameTimeCode": POSTER})
    # processing is asynchronous: wait (up to ~10 min) until nothing is still uploading or processing
    for _ in range(40):
        time.sleep(15)
        states = [state(x) for loc in only if loc in locs
                  for kind, sk in (("appScreenshots", "appScreenshotSets"), ("appPreviews", "appPreviewSets"))
                  for st in get_all(f"/v1/appStoreVersionLocalizations/{locs[loc]}/{sk}")
                  for x in get_all(f"/v1/{sk}/{st['id']}/{kind}")]
        if all(x in ("COMPLETE", "FAILED") for x in states): break
bad = report(only)
print("problems:", bad or "none")
