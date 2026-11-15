// One App Preview title card as a PNG frame sequence (886×1920, 30 fps), for tools/make_preview.sh.
//   swift tools/make_preview_card.swift title <out-dir> <seconds> "<text>"            brand red-orange, big typewriter text
//   swift tools/make_preview_card.swift end   <out-dir> <seconds> "<name>" "<tagline>" white, app icon, name, tagline
// Run from ios/ (the end card reads the app icon from the asset catalog).
import AppKit

let W = 886, H = 1920, fps = 30.0
let args = CommandLine.arguments
let kind = args[1], outDir = URL(fileURLWithPath: args[2]), seconds = Double(args[3])!, text = args[4]
let tagline = args.count > 5 ? args[5] : ""
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

func color(_ hex: UInt32, _ a: CGFloat = 1) -> CGColor {
    CGColor(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: a)
}
func rounded(_ size: CGFloat, _ weight: NSFont.Weight) -> NSFont {
    let base = NSFont.systemFont(ofSize: size, weight: weight)
    return NSFont(descriptor: base.fontDescriptor.withDesign(.rounded) ?? base.fontDescriptor, size: size) ?? base
}
func attributed(_ s: String, _ font: NSFont, _ color: NSColor, _ align: NSTextAlignment) -> NSAttributedString {
    let p = NSMutableParagraphStyle(); p.alignment = align; p.lineBreakMode = .byWordWrapping; p.lineHeightMultiple = 1.02
    return NSAttributedString(string: s, attributes: [.font: font, .foregroundColor: color, .paragraphStyle: p])
}
func height(_ a: NSAttributedString, width: CGFloat) -> CGFloat {
    a.boundingRect(with: CGSize(width: width, height: 10_000), options: [.usesLineFragmentOrigin]).height
}
func context() -> CGContext {
    let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    ctx.translateBy(x: 0, y: CGFloat(H)); ctx.scaleBy(x: 1, y: -1)
    return ctx
}
func drawText(_ a: NSAttributedString, in rect: CGRect, _ ctx: CGContext) {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: true)
    a.draw(with: rect, options: [.usesLineFragmentOrigin])
    NSGraphicsContext.restoreGraphicsState()
}
func write(_ ctx: CGContext, _ i: Int) {
    let url = outDir.appendingPathComponent(String(format: "%04d.png", i))
    try! NSBitmapImageRep(cgImage: ctx.makeImage()!).representation(using: .png, properties: [:])!.write(to: url)
}
func ease(_ t: Double) -> CGFloat { CGFloat(1 - pow(1 - min(max(t, 0), 1), 3)) }

let frames = Int((seconds * fps).rounded())
let margin: CGFloat = 76, width = CGFloat(W) - margin * 2
let chars = Array(text)

if kind == "title" {
    // Size once so that the whole text fits and no word breaks; while typing, the rest of the text is laid out but
    // transparent, so lines never jump.
    func widest(_ size: CGFloat) -> CGFloat {
        text.split(separator: " ").map { attributed(String($0) + "▍", rounded(size, .heavy), .white, .left).size().width }.max() ?? 0
    }
    var size: CGFloat = 132
    while size > 60, widest(size) > width || height(attributed(text + "▍", rounded(size, .heavy), .white, .left), width: width) > 760 { size -= 4 }
    let font = rounded(size, .heavy)
    let full = height(attributed(text, font, .white, .left), width: width)
    let top = (CGFloat(H) - full) / 2 - 40
    let typing = min(seconds * 0.55, Double(chars.count) * 0.045)
    for i in 0..<frames {
        let t = Double(i) / fps
        let ctx = context()
        let bg = CGGradient(colorsSpace: nil, colors: [color(0xF5583A), color(0xF04A2C), color(0xD63A1F)] as CFArray, locations: [0, 0.5, 1])!
        ctx.drawLinearGradient(bg, start: .zero, end: CGPoint(x: 0, y: CGFloat(H)), options: [])
        let n = min(chars.count, Int((t / max(typing, 0.01)) * Double(chars.count)) + 1)
        let cursorOn = n < chars.count || Int(t * 2.5) % 2 == 0
        // whole text laid out once (typed part white, rest transparent); the cursor is a bar after the last typed glyph
        let s = NSMutableAttributedString(attributedString: attributed(String(chars[0..<n]), font, .white, .left))
        s.append(attributed(String(chars[n...]), font, .clear, .left))
        let storage = NSTextStorage(attributedString: s), layout = NSLayoutManager()
        let container = NSTextContainer(size: CGSize(width: width, height: 10_000)); container.lineFragmentPadding = 0
        layout.addTextContainer(container); storage.addLayoutManager(layout)
        let glyphs = layout.glyphRange(forCharacterRange: NSRange(location: 0, length: (String(chars[0..<n]) as NSString).length), actualCharacterRange: nil)
        let line = layout.lineFragmentUsedRect(forGlyphAt: max(glyphs.upperBound - 1, 0), effectiveRange: nil)
        let last = layout.boundingRect(forGlyphRange: NSRange(location: max(glyphs.upperBound - 1, 0), length: 1), in: container)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: true)
        layout.drawGlyphs(forGlyphRange: layout.glyphRange(for: container), at: CGPoint(x: margin, y: top))
        NSGraphicsContext.restoreGraphicsState()
        if cursorOn {
            ctx.setFillColor(color(0xFFFFFF, 0.8))
            ctx.fill(CGRect(x: margin + last.maxX + size * 0.06, y: top + line.minY + line.height * 0.12, width: size * 0.11, height: line.height * 0.8))
        }
        write(ctx, i)
    }
} else {
    let icon = NSImage(contentsOf: URL(fileURLWithPath: "WunderRip/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"))!
        .cgImage(forProposedRect: nil, context: nil, hints: nil)!
    let nameFont = rounded(112, .heavy), tagFont = rounded(40, .semibold)
    let brand = NSColor(srgbRed: 240 / 255, green: 74 / 255, blue: 44 / 255, alpha: 1)
    for i in 0..<frames {
        let t = Double(i) / fps
        let ctx = context()
        ctx.setFillColor(color(0xFFFFFF)); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        let p = ease(t / 0.6), q = ease((t - 0.35) / 0.6)
        let side: CGFloat = 360 * (0.85 + 0.15 * p)
        let iconRect = CGRect(x: (CGFloat(W) - side) / 2, y: 560 + (360 - side) / 2, width: side, height: side)
        ctx.saveGState()
        ctx.setAlpha(p)
        ctx.setShadow(offset: CGSize(width: 0, height: 24), blur: 60, color: color(0xF04A2C, 0.35))
        let path = CGPath(roundedRect: iconRect, cornerWidth: side * 0.225, cornerHeight: side * 0.225, transform: nil)
        ctx.addPath(path); ctx.setFillColor(color(0xF04A2C)); ctx.fillPath()
        ctx.setShadow(offset: .zero, blur: 0, color: nil)
        ctx.addPath(path); ctx.clip()
        ctx.translateBy(x: iconRect.minX, y: iconRect.maxY); ctx.scaleBy(x: 1, y: -1)
        ctx.draw(icon, in: CGRect(x: 0, y: 0, width: side, height: side))
        ctx.restoreGState()
        ctx.saveGState(); ctx.setAlpha(q)
        let name = attributed(text, nameFont, brand, .center)
        drawText(name, in: CGRect(x: margin, y: 1000 + (1 - q) * 30, width: width, height: 160), ctx)
        let tag = attributed(tagline, tagFont, NSColor(white: 0.32, alpha: 1), .center)
        drawText(tag, in: CGRect(x: margin, y: 1150 + (1 - q) * 30, width: width, height: height(tag, width: width) + 10), ctx)
        ctx.restoreGState()
        write(ctx, i)
    }
}
print("✓ \(kind) \(frames) frames → \(outDir.path)")
