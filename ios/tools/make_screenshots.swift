// App Store screenshots: raw simulator captures (appstore/raw/<lang>/) framed on the brand red-orange with localized
// captions from appstore/captions.json. Output: appstore/screenshots/<store-locale>/{iphone,ipad,duo,watch}_N.png
// iPhone 1320×2868 (6.9"), iPad 2064×2752 (13"), iPhone Duo 2007×2853 (inner display), Watch 422×514 (Ultra, unframed).
// No alpha. The app UI exists in en and ru; every other store locale frames the en captures with its own captions.
//
//   swift tools/make_screenshots.swift [store-locale ...]          (run from ios/)
import AppKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let captions = try! JSONSerialization.jsonObject(with: Data(contentsOf: root.appendingPathComponent("appstore/captions.json")))
    as! [String: [String: Any]]
let storeLocales = ["en-US", "ru", "de-DE", "es-ES", "fr-FR", "id", "it", "ja", "ko", "nl-NL", "pl", "pt-BR", "sv", "tr", "uk",
                    "zh-Hans", "zh-Hant"]
func rawLang(_ locale: String) -> String { locale == "ru" ? "ru" : "en" }

func color(_ hex: UInt32, _ a: CGFloat = 1) -> CGColor {
    CGColor(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255, alpha: a)
}

func rounded(_ size: CGFloat, _ weight: NSFont.Weight) -> NSFont {
    let base = NSFont.systemFont(ofSize: size, weight: weight)
    return NSFont(descriptor: base.fontDescriptor.withDesign(.rounded) ?? base.fontDescriptor, size: size) ?? base
}

func textSize(_ s: String, _ font: NSFont, width: CGFloat) -> CGSize {
    NSAttributedString(string: s, attributes: [.font: font])
        .boundingRect(with: CGSize(width: width, height: 10_000), options: [.usesLineFragmentOrigin]).size
}

func draw(_ s: String, font: NSFont, color: NSColor, in rect: CGRect, ctx: CGContext) {
    let p = NSMutableParagraphStyle(); p.alignment = .center; p.lineBreakMode = .byWordWrapping
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: true)
    NSAttributedString(string: s, attributes: [.font: font, .foregroundColor: color, .paragraphStyle: p])
        .draw(with: rect, options: [.usesLineFragmentOrigin])
    NSGraphicsContext.restoreGraphicsState()
}

struct Layout {
    let w: Int, h: Int, title: CGFloat, sub: CGFloat, top: CGFloat, deviceWidth: CGFloat, corner: CGFloat, bezel: CGFloat
    var island: CGRect? = nil   // Dynamic Island in raw-screenshot pixels
}
let phone = Layout(w: 1320, h: 2868, title: 118, sub: 56, top: 150, deviceWidth: 1010, corner: 150, bezel: 26,
                   island: CGRect(x: 518, y: 42, width: 284, height: 110))
let pad = Layout(w: 2064, h: 2752, title: 124, sub: 60, top: 140, deviceWidth: 1660, corner: 60, bezel: 28)
let duo = Layout(w: 2007, h: 2853, title: 124, sub: 60, top: 150, deviceWidth: 1560, corner: 70, bezel: 28)

/// One title size per locale and device: the largest at which every title of the set fits on one line (down to 62%).
func titleSize(_ titles: [String], _ L: Layout) -> CGFloat {
    let cw = CGFloat(L.w) * 0.86
    var ts = L.title
    while ts > L.title * 0.62, titles.contains(where: { textSize($0, rounded(ts, .heavy), width: 100_000).width > cw }) { ts -= 2 }
    return ts
}

/// Subtitle size: shrinks (to 80%) so that it stays on one line; if even that is too long it wraps.
func subSize(_ s: String, _ L: Layout) -> CGFloat {
    var size = L.sub
    while size > L.sub * 0.8, textSize(s, rounded(size, .semibold), width: 100_000).width > CGFloat(L.w) * 0.86 { size -= 1 }
    return size
}

/// Where the device starts: below the tallest caption block of the set, so it sits at the same height on every shot.
func deviceTop(_ captions: [[String]], _ L: Layout, _ ts: CGFloat) -> CGFloat {
    let cw = CGFloat(L.w) * 0.86
    return captions.map { c in
        L.top + textSize(c[0], rounded(ts, .heavy), width: cw).height + 18
            + textSize(c[1], rounded(subSize(c[1], L), .semibold), width: cw).height + 80
    }.max() ?? 0
}

func render(raw: URL, title: String, subtitle: String, layout L: Layout, titleSize ts: CGFloat, deviceY: CGFloat, to out: URL) throws {
    guard let src = NSImage(contentsOf: raw), let cg = src.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        throw NSError(domain: "missing \(raw.path)", code: 1)
    }
    let W = CGFloat(L.w), H = CGFloat(L.h)
    let ctx = CGContext(data: nil, width: L.w, height: L.h, bitsPerComponent: 8, bytesPerRow: 0,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    ctx.translateBy(x: 0, y: H); ctx.scaleBy(x: 1, y: -1)

    // brand red-orange (240 74 44), a little deeper toward the bottom, soft light behind the device
    let bg = CGGradient(colorsSpace: nil, colors: [color(0xF5583A), color(0xF04A2C), color(0xD63A1F)] as CFArray,
                        locations: [0, 0.45, 1])!
    ctx.drawLinearGradient(bg, start: .zero, end: CGPoint(x: 0, y: H), options: [])
    let glow = CGGradient(colorsSpace: nil, colors: [color(0xFFFFFF, 0.16), color(0xFFFFFF, 0)] as CFArray, locations: [0, 1])!
    ctx.drawRadialGradient(glow, startCenter: CGPoint(x: W / 2, y: H * 0.62), startRadius: 0,
                           endCenter: CGPoint(x: W / 2, y: H * 0.62), endRadius: W * 0.75, options: [])

    // captions: title on one line (shrinks, then wraps to two), subtitle up to two lines
    let margin = W * 0.07, cw = W - margin * 2
    let titleH = textSize(title, rounded(ts, .heavy), width: cw).height
    draw(title, font: rounded(ts, .heavy), color: .white, in: CGRect(x: margin, y: L.top, width: cw, height: titleH + 10), ctx: ctx)
    let subY = L.top + titleH + 18
    let ss = subSize(subtitle, L)
    let subH = textSize(subtitle, rounded(ss, .semibold), width: cw).height
    draw(subtitle, font: rounded(ss, .semibold), color: NSColor(white: 1, alpha: 0.88),
         in: CGRect(x: margin, y: subY, width: cw, height: subH + 10), ctx: ctx)

    // device: screenshot with rounded corners, near-black bezel, soft shadow; may run off the bottom edge
    let dw = L.deviceWidth, scale = dw / CGFloat(cg.width), dh = CGFloat(cg.height) * scale
    let screen = CGRect(x: (W - dw) / 2, y: deviceY, width: dw, height: dh)
    let bezel = screen.insetBy(dx: -L.bezel, dy: -L.bezel)
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: 40), blur: 120, color: color(0x5A1206, 0.45))
    ctx.addPath(CGPath(roundedRect: bezel, cornerWidth: L.corner + L.bezel, cornerHeight: L.corner + L.bezel, transform: nil))
    ctx.setFillColor(color(0x161616)); ctx.fillPath()
    ctx.restoreGState()
    ctx.saveGState()
    ctx.addPath(CGPath(roundedRect: screen, cornerWidth: L.corner, cornerHeight: L.corner, transform: nil)); ctx.clip()
    ctx.translateBy(x: screen.minX, y: screen.maxY); ctx.scaleBy(x: 1, y: -1)
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: dw, height: dh))
    ctx.restoreGState()
    if let i = L.island {
        let r = CGRect(x: screen.minX + i.minX * scale, y: screen.minY + i.minY * scale, width: i.width * scale, height: i.height * scale)
        ctx.addPath(CGPath(roundedRect: r, cornerWidth: r.height / 2, cornerHeight: r.height / 2, transform: nil))
        ctx.setFillColor(color(0x000000)); ctx.fillPath()
    }
    try NSBitmapImageRep(cgImage: ctx.makeImage()!).representation(using: .png, properties: [:])!.write(to: out)
}

func opaqueCopy(_ src: URL, to out: URL) throws {
    guard let img = NSImage(contentsOf: src), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return }
    let ctx = CGContext(data: nil, width: cg.width, height: cg.height, bitsPerComponent: 8, bytesPerRow: 0,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: cg.width, height: cg.height))
    try NSBitmapImageRep(cgImage: ctx.makeImage()!).representation(using: .png, properties: [:])!.write(to: out)
}

let only = Set(CommandLine.arguments.dropFirst())
let fm = FileManager.default
for locale in storeLocales where only.isEmpty || only.contains(locale) {
    guard let c = captions[locale], let iphone = c["iphone"] as? [[String]], let ipad = c["ipad"] as? [[String]] else {
        print("– \(locale): no captions"); continue
    }
    let rawDir = root.appendingPathComponent("appstore/raw/\(rawLang(locale))")
    let outDir = root.appendingPathComponent("appstore/screenshots/\(locale)")
    try? fm.removeItem(at: outDir)
    try fm.createDirectory(at: outDir, withIntermediateDirectories: true)
    let tsPhone = titleSize(iphone.map { $0[0] }, phone), tsPad = titleSize(ipad.map { $0[0] }, pad)
    let tsDuo = titleSize(ipad.map { $0[0] }, duo)
    var n = 0
    for (i, t) in iphone.enumerated() {
        let raw = rawDir.appendingPathComponent("iphone_\(i + 1).png")
        guard fm.fileExists(atPath: raw.path) else { print("  ! missing \(raw.lastPathComponent)"); continue }
        n += 1
        try render(raw: raw, title: t[0], subtitle: t[1], layout: phone,
                   titleSize: tsPhone, deviceY: deviceTop(iphone, phone, tsPhone), to: outDir.appendingPathComponent("iphone_\(n).png"))
    }
    for (i, t) in ipad.enumerated() {
        let raw = rawDir.appendingPathComponent("ipad_\(i + 1).png")
        if fm.fileExists(atPath: raw.path) {
            try render(raw: raw, title: t[0], subtitle: t[1], layout: pad,
                       titleSize: tsPad, deviceY: deviceTop(ipad, pad, tsPad), to: outDir.appendingPathComponent("ipad_\(i + 1).png"))
        }
        let duoRaw = rawDir.appendingPathComponent("duo_\(i + 1).png")   // the Duo shots mirror the iPad ones
        if fm.fileExists(atPath: duoRaw.path) {
            try render(raw: duoRaw, title: t[0], subtitle: t[1], layout: duo,
                       titleSize: tsDuo, deviceY: deviceTop(ipad, duo, tsDuo), to: outDir.appendingPathComponent("duo_\(i + 1).png"))
        }
    }
    let watch = rawDir.appendingPathComponent("watch_1.png")
    if fm.fileExists(atPath: watch.path) { try opaqueCopy(watch, to: outDir.appendingPathComponent("watch_1.png")) }
    print("✓ \(locale)")
}
