from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(r"C:\Github\LJ_Freelancer_Projekt_Center")
IMG_DIR = PROJECT_ROOT / "assets" / "images"

files = [
    "black_hole_transparent.png",
    "supernova_transparent.png",
    "planet_blue_transparent.png",
    "planet_gold_transparent.png",
    "project_center.jpg",
]

for name in files:
    src = IMG_DIR / name
    if not src.exists():
        print(f"HIÁNYZIK: {src}")
        continue

    img = Image.open(src)

    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")

    out = src.with_suffix(".webp")

    img.save(
        out,
        "WEBP",
        quality=82,
        method=6,
        lossless=False
    )

    print(f"KÉSZ: {src.name} -> {out.name}")

print("\nOptimalizálás kész.")