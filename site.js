/* The Sign Window. Married stays down until the officiant is with the couple, then it stays. */
(function () {
  var KIT = (window.KIT = window.KIT || { ambient: [], paused: false, hooks: { intro: null, afterBoot: [] } });

  /* sutera back-to-top fit, cubic-bezier(0.70, 0, 0.30, 1) [M] */
  function bez(x1, y1, x2, y2) {
    return function (t) {
      var u = t, i;
      for (i = 0; i < 6; i++) {
        var a = 1 - u;
        var x = 3 * a * a * u * x1 + 3 * a * u * u * x2 + u * u * u;
        var dx = 3 * a * a * x1 + 6 * a * u * (x2 - x1) + 3 * u * u * (1 - x2);
        if (Math.abs(x - t) < 1e-4 || !dx) break;
        u = Math.max(0, Math.min(1, u - (x - t) / dx));
      }
      var b = 1 - u;
      return 3 * b * b * u * y1 + 3 * b * u * u * y2 + u * u * u;
    };
  }

  KIT.hooks.intro = function (g, ctx) {
    var first = (ctx.heroLines || []).filter(function (el) { return !el.hasAttribute("data-payoff"); });
    var tl = g.timeline({ delay: 0.05 });
    if (ctx.loader) tl.to(ctx.loader, { clipPath: "inset(0 0 100% 0)", duration: 0.85, ease: "expo.inOut" }, 0.15);
    tl.add(function () {
      first.forEach(function (el) { el._done = true; });
    }, 0.35);
    var lines = first.map(function (el) { return el._lines || []; }).reduce(function (a, b) { return a.concat(b); }, []).filter(Boolean);
    if (lines.length) tl.to(lines, { yPercent: 0, duration: 0.85, ease: "power3.out", stagger: 0.08 }, 0.35);
    tl.add(function () {
      if (ctx.hero) ctx.hero.querySelectorAll("[data-reveal]").forEach(ctx.reveal);
    }, 0.9);
    if (ctx.loader) tl.set(ctx.loader, { display: "none" }, 1.15);
    return tl;
  };

  KIT.hooks.afterBoot.push(function (g, ST, kit) {
    var word = document.querySelector("[data-payoff]");
    var video = document.getElementById("film-hero");
    var shown = false;

    function showPay() {
      if (shown || !word) return;
      shown = true;
      word.classList.add("is-pay");
      kit.reveal(word);
    }

    if (video && word) {
      var at = parseFloat(word.getAttribute("data-payoff")) || 11.43;
      function tick() {
        if (video.currentTime >= at - 0.05) showPay();
      }
      video.addEventListener("timeupdate", tick);
      video.addEventListener("seeked", tick);
      video.addEventListener("playing", tick);
      video.addEventListener("error", showPay);
      g.ticker.add(tick);
      /* if the film never starts, do not leave the word hidden */
      setTimeout(function () {
        if (!shown && video.currentTime < 0.25) showPay();
      }, 3500);

      /* hero film plays only while on screen, unless Pause is already on */
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (kit.paused) return;
            if (en.isIntersecting) {
              var p = video.play();
              if (p && p.catch) p.catch(function () {});
            } else {
              video.pause();
            }
          });
        }, { threshold: 0.25 });
        io.observe(video);
      }
    }

    var pause = document.querySelector(".motion");
    if (pause) {
      pause.addEventListener("click", function () {
        if (pause.getAttribute("aria-pressed") === "true") showPay();
      });
    }

    var top = document.querySelector(".totop");
    if (top && kit.lenis) {
      var ease = bez(0.7, 0, 0.3, 1);
      top.addEventListener("click", function (e) {
        e.preventDefault();
        kit.lenis.scrollTo(0, { duration: 1.85, easing: ease });
      });
    }
  });
})();
