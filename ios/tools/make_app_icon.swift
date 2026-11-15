// Draws the app icon: a tombstone engraved with a "W" and a small flower at its foot ("the killed Wunderlist"),
// in the brand red-orange. Deliberately no check mark or checkbox, so it can't be mistaken for another to-do app.
// Writes AppIcon-1024.png (light), AppIcon-dark.png and AppIcon-tinted.png into the given appiconset folder.
// Usage: swift tools/make_app_icon.swift WunderRip/Resources/Assets.xcassets/AppIcon.appiconset
import AppKit
import UniformTypeIdentifiers

let size = 1024.0
let space = CGColorSpace(name: CGColorSpace.sRGB)!

func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
}

struct Style {
    var background: [CGColor]   // top → bottom gradient; empty = transparent (tinted icons are templates)
    var stone: CGColor
    var stoneShade: CGColor
    var engraving: CGColor
    var ground: CGColor
    var petals: CGColor
    var flowerCenter: CGColor
    var stem: CGColor
}

/// Tombstone: rounded top, flat base. Coordinates are CoreGraphics (origin bottom-left).
func tombstone() -> CGPath {
    let path = CGMutablePath()
    let width = 500.0, left = (size - width) / 2, right = left + width
    let bottom = 215.0, shoulder = 560.0, radius = width / 2
    path.move(to: CGPoint(x: left, y: bottom))
    path.addLine(to: CGPoint(x: left, y: shoulder))
    path.addArc(center: CGPoint(x: size / 2, y: shoulder), radius: radius, startAngle: .pi, endAngle: 0, clockwise: true)
    path.addLine(to: CGPoint(x: right, y: bottom))
    path.closeSubpath()
    return path
}

/// The engraved "W": two V strokes, flat at the top.
func letterW() -> CGPath {
    let path = CGMutablePath()
    let top = 600.0, bottom = 395.0, left = 392.0, right = 632.0
    let step = (right - left) / 4
    path.move(to: CGPoint(x: left, y: top))
    path.addLine(to: CGPoint(x: left + step, y: bottom))
    path.addLine(to: CGPoint(x: left + 2 * step, y: top - 120))
    path.addLine(to: CGPoint(x: left + 3 * step, y: bottom))
    path.addLine(to: CGPoint(x: right, y: top))
    return path
}

/// A small flower leaning on the stone: stem, leaf and five petals.
func drawFlower(_ ctx: CGContext, petals: CGColor, center: CGColor, stem: CGColor) {
    let base = CGPoint(x: 800, y: 222), head = CGPoint(x: 828, y: 340)
    ctx.setStrokeColor(stem)
    ctx.setLineWidth(14)
    ctx.setLineCap(.round)
    ctx.move(to: base)
    ctx.addQuadCurve(to: head, control: CGPoint(x: 790, y: 295))
    ctx.strokePath()
    ctx.setFillColor(stem)
    ctx.fillEllipse(in: CGRect(x: 802, y: 260, width: 44, height: 20))
    ctx.setFillColor(petals)
    for i in 0 ..< 5 {
        let angle = Double(i) * 2 * .pi / 5 + .pi / 2
        ctx.fillEllipse(in: CGRect(x: head.x + cos(angle) * 22 - 18, y: head.y + sin(angle) * 22 - 18, width: 36, height: 36))
    }
    ctx.setFillColor(center)
    ctx.fillEllipse(in: CGRect(x: head.x - 13, y: head.y - 13, width: 26, height: 26))
}

func draw(_ style: Style, to url: URL, opaque: Bool) {
    let ctx = CGContext(data: nil, width: Int(size), height: Int(size), bitsPerComponent: 8, bytesPerRow: 0, space: space,
                        bitmapInfo: (opaque ? CGImageAlphaInfo.noneSkipLast : CGImageAlphaInfo.premultipliedLast).rawValue)!
    if style.background.count >= 2 {
        let gradient = CGGradient(colorsSpace: space, colors: style.background as CFArray, locations: nil)!
        ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: size), end: CGPoint(x: 0, y: 0), options: [])
    }

    // Ground: a soft ellipse the stone stands on.
    ctx.setFillColor(style.ground)
    ctx.fillEllipse(in: CGRect(x: size / 2 - 330, y: 175, width: 660, height: 80))

    // Stone with a gentle drop shadow and a darker right side for depth.
    let stone = tombstone()
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -14), blur: 40, color: rgb(0x000000, opaque ? 0.22 : 0))
    ctx.addPath(stone)
    ctx.setFillColor(style.stone)
    ctx.fillPath()
    ctx.restoreGState()

    ctx.saveGState()
    ctx.addPath(stone)
    ctx.clip()
    ctx.setFillColor(style.stoneShade)
    ctx.fill(CGRect(x: size / 2 + 150, y: 0, width: 200, height: size))
    ctx.restoreGState()

    // Engraved W.
    ctx.addPath(letterW())
    ctx.setStrokeColor(style.engraving)
    ctx.setLineWidth(46)
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)
    ctx.strokePath()

    drawFlower(ctx, petals: style.petals, center: style.flowerCenter, stem: style.stem)

    let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
    CGImageDestinationFinalize(dest)
}

guard CommandLine.arguments.count == 2 else {
    print("usage: make_app_icon.swift <AppIcon.appiconset>"); exit(1)
}
let folder = URL(fileURLWithPath: CommandLine.arguments[1])

// Brand accent: rgb(240 74 44) (web light) … rgb(255 99 71) (web dark).
draw(Style(background: [rgb(0xFF6A47), rgb(0xE5381F)], stone: rgb(0xFFFFFF), stoneShade: rgb(0xF1ECEA),
           engraving: rgb(0xF04A2C), ground: rgb(0xB82A14, 0.35),
           petals: rgb(0xFFD84D), flowerCenter: rgb(0xF04A2C), stem: rgb(0x2F8F4E)),
     to: folder.appendingPathComponent("AppIcon-1024.png"), opaque: true)
draw(Style(background: [rgb(0x2B2B30), rgb(0x141416)], stone: rgb(0xFF6347), stoneShade: rgb(0xE8503A),
           engraving: rgb(0x1C1C1F), ground: rgb(0x000000, 0.45),
           petals: rgb(0xFFD84D), flowerCenter: rgb(0x1C1C1F), stem: rgb(0x3FAF62)),
     to: folder.appendingPathComponent("AppIcon-dark.png"), opaque: true)
draw(Style(background: [], stone: rgb(0xFFFFFF), stoneShade: rgb(0xD9D9D9),
           engraving: rgb(0x000000, 1), ground: rgb(0xFFFFFF, 0.25),
           petals: rgb(0xFFFFFF, 0.9), flowerCenter: rgb(0x000000), stem: rgb(0xFFFFFF, 0.7)),
     to: folder.appendingPathComponent("AppIcon-tinted.png"), opaque: false)
print("✓ icons written to \(folder.path)")
