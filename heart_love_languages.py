import colorsys
import math
import random
import sys
from dataclasses import dataclass

import pygame


# Edit this list to use your own languages or messages.
# Keep each item as: ("Language name", "Translated phrase")
PHRASES = [
    ("English", "I love you"),
    ("Malay", "Saya cinta padamu"),
    ("Indonesian", "Aku cinta kamu"),
    ("Spanish", "Te amo"),
    ("French", "Je t'aime"),
    ("Italian", "Ti amo"),
    ("Portuguese", "Eu te amo"),
    ("German", "Ich liebe dich"),
    ("Dutch", "Ik hou van jou"),
    ("Turkish", "Seni seviyorum"),
    ("Filipino", "Mahal kita"),
    ("Swahili", "Nakupenda"),
    ("Vietnamese", "Anh yeu em"),
    ("Japanese", "愛してる"),
    ("Korean", "사랑해"),
    ("Chinese", "我爱你"),
    ("Hindi", "मैं तुमसे प्यार करता हूँ"),
    ("Arabic", "أحبك"),
    ("Russian", "Я тебя люблю"),
    ("Greek", "Σ' αγαπώ"),
    ("Thai", "ฉันรักคุณ"),
    ("Tamil", "நான் உன்னை காதலிக்கிறேன்"),
]

WIDTH = 1000
HEIGHT = 720
FPS = 60
PARTICLE_COUNT = 210
PHRASE_SECONDS = 2.2
BACKGROUND = (5, 4, 12)

FONT_CANDIDATES = [
    "Noto Sans",
    "Segoe UI",
    "Segoe UI Symbol",
    "Arial Unicode MS",
    "Arial",
    "Microsoft YaHei",
    "SimHei",
    "Yu Gothic",
    "Malgun Gothic",
    "Nirmala UI",
    "DejaVu Sans",
]


@dataclass
class WordParticle:
    t: float
    text: str
    phase: float
    size: int
    depth: float
    drift: float


@dataclass
class Spark:
    x: float
    y: float
    vx: float
    vy: float
    text: str
    life: float
    max_life: float
    size: int
    hue: float


def heart_point(t: float) -> tuple[float, float]:
    """Classic parametric heart curve."""
    x = 16 * math.sin(t) ** 3
    y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
    return x, y


def build_font_paths() -> list[str]:
    paths = []
    for name in FONT_CANDIDATES:
        path = pygame.font.match_font(name)
        if path and path not in paths:
            paths.append(path)
    return paths


FONT_PATHS: list[str] = []
FONT_CACHE: dict[tuple[str, int, bool], pygame.font.Font] = {}


def font_supports_text(font: pygame.font.Font, text: str) -> bool:
    try:
        metrics = font.metrics(text)
    except Exception:
        return False

    if not metrics:
        return False

    for char, metric in zip(text, metrics):
        if char.strip() and metric is None:
            return False
    return True


def get_font(text: str, size: int, bold: bool = False) -> pygame.font.Font:
    key = (text, size, bold)
    if key in FONT_CACHE:
        return FONT_CACHE[key]

    for path in FONT_PATHS:
        font = pygame.font.Font(path, size)
        font.set_bold(bold)
        if font_supports_text(font, text):
            FONT_CACHE[key] = font
            return font

    fallback = pygame.font.SysFont("arial", size, bold=bold)
    FONT_CACHE[key] = fallback
    return fallback


def hsv_color(hue: float, sat: float = 0.78, val: float = 1.0, alpha: int = 255) -> tuple[int, int, int, int]:
    r, g, b = colorsys.hsv_to_rgb(hue % 1.0, sat, val)
    return int(r * 255), int(g * 255), int(b * 255), alpha


def render_glow_text(
    surface: pygame.Surface,
    text: str,
    font: pygame.font.Font,
    center: tuple[int, int],
    color: tuple[int, int, int],
    alpha: int = 255,
    glow: int = 4,
) -> None:
    glow_color = (color[0], color[1], color[2], max(30, alpha // 5))
    glow_img = font.render(text, True, glow_color)
    glow_img.set_alpha(glow_color[3])
    rect = glow_img.get_rect(center=center)

    for dx, dy in ((-glow, 0), (glow, 0), (0, -glow), (0, glow), (-glow, -glow), (glow, glow)):
        surface.blit(glow_img, rect.move(dx, dy))

    text_img = font.render(text, True, color)
    text_img.set_alpha(alpha)
    surface.blit(text_img, text_img.get_rect(center=center))


def make_particles() -> list[WordParticle]:
    particles = []
    for i in range(PARTICLE_COUNT):
        t = (i / PARTICLE_COUNT) * math.tau
        _, phrase = PHRASES[i % len(PHRASES)]
        particles.append(
            WordParticle(
                t=t,
                text=phrase,
                phase=random.random() * math.tau,
                size=random.randint(13, 18),
                depth=random.random(),
                drift=random.uniform(1.5, 5.5),
            )
        )
    return particles


def make_sparks(origin: tuple[int, int], amount: int = 34) -> list[Spark]:
    sparks = []
    for i in range(amount):
        angle = (i / amount) * math.tau + random.uniform(-0.12, 0.12)
        speed = random.uniform(90, 270)
        _, phrase = random.choice(PHRASES)
        sparks.append(
            Spark(
                x=origin[0],
                y=origin[1],
                vx=math.cos(angle) * speed,
                vy=math.sin(angle) * speed,
                text=phrase,
                life=random.uniform(1.0, 1.8),
                max_life=1.8,
                size=random.randint(14, 22),
                hue=random.random(),
            )
        )
    return sparks


def draw_background(surface: pygame.Surface, elapsed: float) -> None:
    surface.fill(BACKGROUND)
    w, h = surface.get_size()

    for i in range(48):
        x = (i * 137 + elapsed * (14 + i % 5)) % (w + 120) - 60
        y = (i * 83 + math.sin(elapsed * 0.7 + i) * 32) % (h + 120) - 60
        hue = 0.92 + math.sin(i) * 0.08
        color = hsv_color(hue, 0.45, 0.8, 28)
        pygame.draw.circle(surface, color, (int(x), int(y)), 1 + i % 3)


def draw_heart_words(surface: pygame.Surface, particles: list[WordParticle], elapsed: float) -> None:
    w, h = surface.get_size()
    center_x = w / 2
    center_y = h / 2 + 30
    scale = min(w, h) / 43
    beat = 1.0 + 0.052 * math.sin(elapsed * 3.4) + 0.018 * math.sin(elapsed * 6.8)

    for i, particle in enumerate(particles):
        hx, hy = heart_point(particle.t)
        float_x = math.cos(elapsed * 0.8 + particle.phase) * particle.drift
        float_y = math.sin(elapsed * 0.9 + particle.phase) * particle.drift
        x = center_x + hx * scale * beat + float_x
        y = center_y - hy * scale * beat + float_y

        hue = 0.88 + 0.18 * math.sin(elapsed * 0.45 + particle.phase + i * 0.04)
        color = hsv_color(hue, 0.68, 1.0, int(130 + particle.depth * 90))
        font = get_font(particle.text, particle.size, False)
        img = font.render(particle.text, True, color)
        img.set_alpha(color[3])
        surface.blit(img, img.get_rect(center=(round(x), round(y))))


def draw_center_phrase(surface: pygame.Surface, elapsed: float) -> None:
    w, h = surface.get_size()
    index = int(elapsed / PHRASE_SECONDS) % len(PHRASES)
    language, phrase = PHRASES[index]
    cycle = (elapsed % PHRASE_SECONDS) / PHRASE_SECONDS
    fade = min(1.0, cycle * 4, (1 - cycle) * 4)

    phrase_size = max(34, min(76, int(w / max(8, len(phrase) * 0.62))))
    phrase_font = get_font(phrase, phrase_size, True)
    label_font = get_font(language, 22, False)

    y = int(h * 0.49 + math.sin(elapsed * 3.2) * 4)
    color = (255, 235, 246)
    accent = (143, 233, 255)
    alpha = int(255 * fade)

    render_glow_text(surface, phrase, phrase_font, (w // 2, y), color, alpha, 6)
    render_glow_text(surface, language, label_font, (w // 2, y + phrase_size // 2 + 34), accent, alpha, 3)


def update_and_draw_sparks(surface: pygame.Surface, sparks: list[Spark], dt: float) -> list[Spark]:
    alive = []
    for spark in sparks:
        spark.life -= dt
        if spark.life <= 0:
            continue

        spark.vy += 100 * dt
        spark.x += spark.vx * dt
        spark.y += spark.vy * dt
        progress = spark.life / spark.max_life
        alpha = int(230 * max(0, min(1, progress)))
        color = hsv_color(spark.hue, 0.62, 1.0, alpha)
        font = get_font(spark.text, spark.size, False)
        img = font.render(spark.text, True, color)
        img.set_alpha(alpha)
        surface.blit(img, img.get_rect(center=(round(spark.x), round(spark.y))))
        alive.append(spark)
    return alive


def main() -> int:
    pygame.init()
    pygame.font.init()

    global FONT_PATHS
    FONT_PATHS = build_font_paths()

    screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
    pygame.display.set_caption("I love you in different languages")
    clock = pygame.time.Clock()

    particles = make_particles()
    sparks: list[Spark] = []
    elapsed = 0.0
    paused = False

    while True:
        dt = clock.tick(FPS) / 1000
        if not paused:
            elapsed += dt

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return 0
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    pygame.quit()
                    return 0
                if event.key == pygame.K_SPACE:
                    paused = not paused
                if event.key == pygame.K_r:
                    particles = make_particles()
            if event.type == pygame.MOUSEBUTTONDOWN:
                sparks.extend(make_sparks(event.pos))

        draw_background(screen, elapsed)
        draw_heart_words(screen, particles, elapsed)
        draw_center_phrase(screen, elapsed)
        sparks = update_and_draw_sparks(screen, sparks, 0 if paused else dt)

        pygame.display.flip()


if __name__ == "__main__":
    raise SystemExit(main())
