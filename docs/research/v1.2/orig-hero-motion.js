
(function () {
  "use strict";

  function initHeroParticles() {
    var hero = document.querySelector(".ov-hero");
    if (!hero || hero.dataset.ovHeroParticlesReady === "true") return;

    var canvas = hero.querySelector(".ov-hero-video-particles canvas");
    if (!canvas || typeof canvas.getContext !== "function") return;

    var context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var particles = [];
    var nebulae = [];
    var staticCanvas = document.createElement("canvas");
    var staticContext = staticCanvas.getContext("2d", { alpha: true });
    var shootingStars = [];
    var nextShootingStar = 0;
    var width = 0;
    var height = 0;
    var pixelRatio = 1;
    var animationFrame = 0;
    var lastTime = 0;
    var frameInterval = 1000 / 30;
    var visible = true;
    var brandColors = {
      light: [255, 236, 255],
      signal: [210, 142, 190],
      unity: [126, 164, 255],
      horizon: [91, 211, 226]
    };

    hero.dataset.ovHeroParticlesReady = "true";
    canvas.setAttribute("aria-hidden", "true");

    function resolveBrandColors() {
      if (!document.body) return;
      var probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);

      function resolve(variable, fallback) {
        probe.style.color = "rgb(var(" + variable + "))";
        var channels = window.getComputedStyle(probe).color.match(/[\d.]+/g);
        return channels && channels.length >= 3
          ? channels.slice(0, 3).map(Number)
          : fallback;
      }

      brandColors.light = resolve("--ov-midnight-50-rgb", brandColors.light);
      brandColors.signal = resolve("--ov-signal-300-rgb", brandColors.signal);
      brandColors.unity = resolve("--ov-unity-300-rgb", brandColors.unity);
      brandColors.horizon = resolve("--ov-horizon-300-rgb", brandColors.horizon);
      probe.remove();
    }

    resolveBrandColors();

    function randomBetween(minimum, maximum) {
      return minimum + Math.random() * (maximum - minimum);
    }

    function seededRandom(seed) {
      var value = seed >>> 0;
      return function () {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
      };
    }

    function renderStaticField() {
      if (!staticContext) return;

      var ratio = Math.min(pixelRatio, 1.25);
      var desktop = width >= 1280;
      var maximum = width < 768 ? 220 : desktop ? 520 : 340;
      var count = Math.min(maximum, Math.max(140, Math.round(width * height / 3600)));
      var random = seededRandom(270927);
      var palette = [
        brandColors.light,
        brandColors.signal,
        brandColors.unity,
        brandColors.horizon
      ];

      staticCanvas.width = Math.round(width * ratio);
      staticCanvas.height = Math.round(height * ratio);
      staticContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      staticContext.clearRect(0, 0, width, height);

      for (var index = 0; index < count; index += 1) {
        var favorRight = desktop && index >= count * 0.62;
        var x = width * (favorRight ? 0.44 + random() * 0.54 : random());
        var y = height * (favorRight ? 0.30 + random() * 0.62 : random());
        var radius = 0.28 + random() * 0.72;
        var alpha = 0.16 + random() * 0.38;
        var color = palette[Math.floor(random() * palette.length)];

        staticContext.fillStyle = "rgba(" + color.join(",") + "," + alpha + ")";
        staticContext.beginPath();
        staticContext.arc(x, y, radius, 0, Math.PI * 2);
        staticContext.fill();
      }
    }

    function createParticle(preferRight) {
      var palette = [
        brandColors.light,
        brandColors.signal,
        brandColors.unity,
        brandColors.horizon
      ];
      return {
        x: preferRight ? width * randomBetween(0.44, 0.98) : Math.random() * width,
        y: preferRight ? height * randomBetween(0.30, 0.92) : Math.random() * height,
        radius: randomBetween(0.45, 1.65),
        alpha: randomBetween(0.18, 0.74),
        phase: Math.random() * Math.PI * 2,
        twinkle: randomBetween(0.00045, 0.00125),
        flare: Math.random() < 0.14,
        flarePhase: Math.random() * Math.PI * 2,
        flareSpeed: randomBetween(0.00016, 0.00034),
        depthTravel: Math.random() < 0.34,
        depthPhase: Math.random() * Math.PI * 2,
        depthSpeed: randomBetween(0.00008, 0.00020),
        driftX: randomBetween(-0.0025, 0.005),
        driftY: randomBetween(-0.009, -0.0025),
        color: palette[Math.floor(Math.random() * palette.length)]
      };
    }

    function populate() {
      var area = width * height;
      var desktop = width >= 1280;
      var maximum = width < 768 ? 70 : desktop ? 140 : 100;
      var count = Math.min(maximum, Math.max(48, Math.round(area / 12000)));
      particles = Array.from({ length: count }, function (_, index) {
        return createParticle(desktop && index >= count * 0.58);
      });
      nebulae = [
        { x: 0.25, y: 0.46, radius: 0.62, phase: 0.8, speed: 0.000014, color: brandColors.signal },
        { x: 0.66, y: 0.31, radius: 0.54, phase: 3.1, speed: 0.000010, color: brandColors.unity },
        { x: 0.82, y: 0.68, radius: 0.48, phase: 5.2, speed: 0.000017, color: brandColors.horizon }
      ];
      renderStaticField();
    }

    function drawNebula(time) {
      nebulae.forEach(function (cloud) {
        var drift = reduceMotion.matches ? cloud.phase : cloud.phase + time * cloud.speed;
        var x = width * (cloud.x + Math.sin(drift) * 0.055);
        var y = height * (cloud.y + Math.cos(drift * 0.76) * 0.045);
        var radius = Math.max(width, height) * cloud.radius;
        var color = cloud.color.join(",");
        var nebula = context.createRadialGradient(x, y, 0, x, y, radius);

        nebula.addColorStop(0, "rgba(" + color + ",0.085)");
        nebula.addColorStop(0.38, "rgba(" + color + ",0.050)");
        nebula.addColorStop(0.72, "rgba(" + color + ",0.018)");
        nebula.addColorStop(1, "rgba(" + color + ",0)");
        context.fillStyle = nebula;
        context.fillRect(0, 0, width, height);
      });
    }

    function createShootingStar(time) {
      var angle = randomBetween(0.42, 0.68);
      var speed = randomBetween(0.42, 0.62);
      shootingStars.push({
        x: randomBetween(-width * 0.08, width * 0.72),
        y: randomBetween(height * 0.04, height * 0.38),
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        length: randomBetween(90, 170),
        born: time,
        lifetime: randomBetween(680, 980)
      });
    }

    function drawShootingStars(time, elapsed) {
      if (reduceMotion.matches) {
        shootingStars = [];
        return;
      }

      if (time >= nextShootingStar) {
        createShootingStar(time);
        nextShootingStar = time + randomBetween(4200, 9200);
      }

      shootingStars = shootingStars.filter(function (star) {
        var progress = (time - star.born) / star.lifetime;
        if (progress >= 1) return false;

        star.x += star.velocityX * elapsed;
        star.y += star.velocityY * elapsed;

        var distance = Math.hypot(star.velocityX, star.velocityY);
        var tailX = star.x - (star.velocityX / distance) * star.length;
        var tailY = star.y - (star.velocityY / distance) * star.length;
        var opacity = Math.sin(progress * Math.PI) * 0.82;
        var streak = context.createLinearGradient(tailX, tailY, star.x, star.y);
        streak.addColorStop(0, "rgba(" + brandColors.horizon.join(",") + ",0)");
        streak.addColorStop(0.72, "rgba(" + brandColors.unity.join(",") + "," + (opacity * 0.38) + ")");
        streak.addColorStop(1, "rgba(" + brandColors.light.join(",") + "," + opacity + ")");

        context.strokeStyle = streak;
        context.lineWidth = 1.35;
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(star.x, star.y);
        context.stroke();
        return true;
      });
    }

    function resize() {
      var bounds = canvas.getBoundingClientRect();
      var nextWidth = Math.max(1, Math.round(bounds.width));
      var nextHeight = Math.max(1, Math.round(bounds.height));
      var nextRatio = Math.min(window.devicePixelRatio || 1, 1.75);

      if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;

      width = nextWidth;
      height = nextHeight;
      pixelRatio = nextRatio;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      populate();
      if (!nextShootingStar) {
        nextShootingStar = performance.now() + randomBetween(1600, 4800);
      }
      draw(performance.now(), 0);
    }

    function draw(time, elapsed) {
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = "screen";
      drawNebula(time);
      if (staticContext) {
        context.drawImage(
          staticCanvas,
          0, 0, staticCanvas.width, staticCanvas.height,
          0, 0, width, height
        );
      }

      particles.forEach(function (particle) {
        if (elapsed) {
          particle.x += particle.driftX * elapsed;
          particle.y += particle.driftY * elapsed;
          if (particle.y < -4) particle.y = height + 4;
          if (particle.x < -4) particle.x = width + 4;
          if (particle.x > width + 4) particle.x = -4;
        }

        var pulse = 0.64 + Math.sin(particle.phase + time * particle.twinkle) * 0.36;
        var flare = particle.flare
          ? Math.pow(Math.max(0, Math.sin(particle.flarePhase + time * particle.flareSpeed)), 14)
          : 0;
        var depth = particle.depthTravel
          ? 0.5 + Math.sin(particle.depthPhase + time * particle.depthSpeed) * 0.5
          : 1;
        var drawRadius = particle.radius * (1 + (1 - depth) * 3.2);
        var alpha = Math.min(1, (particle.alpha * pulse + flare * 0.86) * (0.28 + depth * 0.72));
        var color = particle.color;

        if (particle.radius > 1.15 || depth < 0.72) {
          var glow = context.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, drawRadius * 5
          );
          glow.addColorStop(0, "rgba(" + color.join(",") + "," + alpha + ")");
          glow.addColorStop(1, "rgba(" + color.join(",") + ",0)");
          context.fillStyle = glow;
          context.beginPath();
          context.arc(particle.x, particle.y, drawRadius * 5, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillStyle = "rgba(" + color.join(",") + "," + alpha + ")";
          context.beginPath();
          context.arc(particle.x, particle.y, drawRadius, 0, Math.PI * 2);
          context.fill();
        }

        if (flare > 0.34) {
          var ray = particle.radius * (4 + flare * 5);
          context.strokeStyle = "rgba(" + color.join(",") + "," + (flare * 0.58) + ")";
          context.lineWidth = 0.7;
          context.beginPath();
          context.moveTo(particle.x - ray, particle.y);
          context.lineTo(particle.x + ray, particle.y);
          context.moveTo(particle.x, particle.y - ray);
          context.lineTo(particle.x, particle.y + ray);
          context.stroke();
        }
      });

      drawShootingStars(time, elapsed);
      context.restore();
    }

    function animate(time) {
      animationFrame = 0;
      if (lastTime && time - lastTime < frameInterval) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }
      var elapsed = lastTime ? Math.min(time - lastTime, 40) : 0;
      lastTime = time;
      draw(time, elapsed);
      if (visible && !reduceMotion.matches && !document.hidden) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    function updateAnimation() {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      lastTime = 0;
      if (visible && !reduceMotion.matches && !document.hidden) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        draw(performance.now(), 0);
      }
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        updateAnimation();
      }, { rootMargin: "100px" }).observe(hero);
    }

    document.addEventListener("visibilitychange", updateAnimation);
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", updateAnimation);
    } else {
      reduceMotion.addListener(updateAnimation);
    }

    resize();
    updateAnimation();
  }

  function start() {
    initHeroParticles();
    if (!document.querySelector(".ov-hero") && "MutationObserver" in window) {
      var observer = new MutationObserver(function () {
        initHeroParticles();
        if (document.querySelector(".ov-hero[data-ov-hero-particles-ready='true']")) {
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
