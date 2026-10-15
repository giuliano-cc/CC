#!/usr/bin/env python3
"""Disegna l'icona (due fogli sovrapposti su sfondo blu) e scrive icon.icns. Richiede Pillow."""
import io, struct
from PIL import Image, ImageDraw

S = 4096  # disegno ad alta risoluzione, poi ridotto (antialiasing)


def draw():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # sfondo: quadrato arrotondato con gradiente verticale
    grad = Image.new("RGBA", (S, S))
    gp = grad.load()
    top, bot = (64, 156, 255), (10, 84, 214)
    for y in range(S):
        t = y / (S - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,)
        for x in range(S):
            gp[x, y] = c
    m = int(S * 0.098)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([m, m, S - m, S - m], radius=int(S * 0.2), fill=255)
    img.paste(grad, (0, 0), mask)
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    def sheet(x, y, w, h, fill, fold):
        d.rounded_rectangle([x, y, x + w, y + h], radius=int(S * 0.03), fill=fill,
                            outline=(255, 255, 255, 220), width=int(S * 0.008))
        for i in range(3):  # righe di testo
            ly = y + h * (0.32 + i * 0.17)
            d.rounded_rectangle([x + w * 0.16, ly, x + w * (0.84 if i < 2 else 0.58), ly + h * 0.06],
                                radius=int(S * 0.01), fill=fold)

    w, h = int(S * 0.36), int(S * 0.46)
    sheet(int(S * 0.2), int(S * 0.2), w, h, (255, 255, 255, 70), (255, 255, 255, 110))  # foglio dietro (fantasma)
    sheet(int(S * 0.44), int(S * 0.34), w, h, (255, 255, 255, 255), (150, 190, 240, 255))  # foglio davanti
    # segno di spunta "uno solo basta" sul foglio davanti
    cx, cy, r = int(S * 0.74), int(S * 0.7), int(S * 0.12)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(52, 199, 89, 255), outline=(255, 255, 255, 255), width=int(S * 0.012))
    pts = [(cx - r * 0.45, cy + r * 0.02), (cx - r * 0.1, cy + r * 0.38), (cx + r * 0.5, cy - r * 0.35)]
    d.line(pts, fill=(255, 255, 255, 255), width=int(S * 0.026), joint="curve")
    return Image.alpha_composite(img, layer)


def icns(img, path):
    chunks = b""
    for code, size in (("ic07", 128), ("ic08", 256), ("ic09", 512), ("ic10", 1024)):
        buf = io.BytesIO()
        img.resize((size, size), Image.LANCZOS).save(buf, "PNG")
        data = buf.getvalue()
        chunks += code.encode() + struct.pack(">I", len(data) + 8) + data
    with open(path, "wb") as f:
        f.write(b"icns" + struct.pack(">I", len(chunks) + 8) + chunks)


if __name__ == "__main__":
    im = draw()
    icns(im, "icon.icns")
    im.resize((512, 512), Image.LANCZOS).save("icon_preview.png")
    print("Creati icon.icns e icon_preview.png")
