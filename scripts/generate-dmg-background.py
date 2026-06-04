#!/usr/bin/env python3
"""Generate DMG background images for OneApp installer."""

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def find_font(size, chinese=False):
    if chinese:
        candidates = [
            "/System/Library/Fonts/Hiragino Sans GB.ttc",
            "/System/Library/Fonts/STHeiti Light.ttc",
            "/Library/Fonts/Arial Unicode.ttf",
        ]
    else:
        candidates = [
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def bezier_point(t, p0, p1, p2, p3):
    u = 1 - t
    return (
        u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0],
        u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1],
    )


def generate_background(width, height):
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    # Vertical gradient: #f0f0f0 (top) -> #e0e0e0 (bottom)
    for y in range(height):
        t = y / height
        v = int(240 - t * 16)  # 240 -> 224
        draw.line([(0, y), (width, y)], fill=(v, v, v))

    scale = width / 660.0

    # Bezier curve arrow: left icon area -> right icon area
    # Icon centers: (180, 170) and (480, 170) at 1x
    x_start = 230 * scale
    x_end = 430 * scale
    y_center = 200 * scale
    arc_height = 50 * scale

    p0 = (x_start, y_center)
    p1 = (x_start + (x_end - x_start) * 0.3, y_center + arc_height)
    p2 = (x_start + (x_end - x_start) * 0.7, y_center + arc_height)
    p3 = (x_end, y_center)

    steps = int(100 * scale)
    points = [bezier_point(i / steps, p0, p1, p2, p3) for i in range(steps + 1)]

    line_width = max(3, int(3 * scale))
    color = (140, 140, 140)  # slightly lighter for subtlety on light bg

    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=color, width=line_width)

    # Arrowhead
    tip = points[-1]
    prev = points[-5]
    angle = math.atan2(tip[1] - prev[1], tip[0] - prev[0])
    arrow_len = 14 * scale
    arrow_angle = 0.4

    left = (
        tip[0] - arrow_len * math.cos(angle - arrow_angle),
        tip[1] - arrow_len * math.sin(angle - arrow_angle),
    )
    right = (
        tip[0] - arrow_len * math.cos(angle + arrow_angle),
        tip[1] - arrow_len * math.sin(angle + arrow_angle),
    )
    draw.polygon([tip, left, right], fill=color)

    # Text (mixed Chinese + English)
    font_size = int(14 * scale)
    font = find_font(font_size, chinese=True)
    text = "拖入 Applications 安装"
    text_color = (120, 120, 120)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_x = (width - text_w) / 2
    text_y = 320 * scale
    draw.text((text_x, text_y), text, fill=text_color, font=font)

    return img


def main():
    build_dir = Path(__file__).parent.parent / "build"
    build_dir.mkdir(exist_ok=True)

    bg_1x = generate_background(660, 400)
    bg_1x.save(build_dir / "background.png")
    print(f"Generated: {build_dir / 'background.png'} (660x400)")

    bg_2x = generate_background(1320, 800)
    bg_2x.save(build_dir / "background@2x.png")
    print(f"Generated: {build_dir / 'background@2x.png'} (1320x800)")


if __name__ == "__main__":
    main()
