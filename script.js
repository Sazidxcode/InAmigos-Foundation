/* ==========================================================================
   InAmigos Foundation — script.js
   Vanilla JS only. Organized into clearly commented, self-contained modules.
   ========================================================================== */
"use strict";

document.addEventListener("DOMContentLoaded", function () {

  /* ------------------------------------------------------------------ */
  /* 0. Small helpers                                                    */
  /* ------------------------------------------------------------------ */
  var qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* 1. Sticky navbar — solid/blurred background once the page scrolls   */
  /* ------------------------------------------------------------------ */
  (function stickyHeader() {
    var header = qs("#siteHeader");
    if (!header) return;

    var updateHeader = function () {
      if (window.scrollY > 40) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  })();

  /* ------------------------------------------------------------------ */
  /* 2. Mobile navigation toggle                                         */
  /* ------------------------------------------------------------------ */
  (function mobileNav() {
    var toggle = qs("#navToggle");
    var menu = qs("#navMenu");
    if (!toggle || !menu) return;

    var closeMenu = function () {
      menu.classList.remove("is-open");
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    };

    var openMenu = function () {
      menu.classList.add("is-open");
      toggle.classList.add("is-active");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
    };

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.contains("is-open");
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });

    // Close the mobile menu whenever a nav link is chosen
    qsa(".nav-link, .nav-cta", menu).forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });
  })();

  /* ------------------------------------------------------------------ */
  /* 3. Active navigation link while scrolling                           */
  /* ------------------------------------------------------------------ */
  (function activeNavLink() {
    var sections = qsa("section[id]");
    var navLinks = qsa(".nav-link");
    if (!sections.length || !navLinks.length) return;

    var linkFor = function (id) {
      return navLinks.filter(function (l) { return l.getAttribute("href") === "#" + id; })[0];
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = linkFor(entry.target.id);
        if (!link) return;
        navLinks.forEach(function (l) { l.classList.remove("active-link"); });
        link.classList.add("active-link");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  })();

  /* ------------------------------------------------------------------ */
  /* 4. Scroll-reveal animations (fade + slide up)                       */
  /* ------------------------------------------------------------------ */
  (function scrollReveal() {
    var items = qsa(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

    items.forEach(function (el) { observer.observe(el); });
  })();

  /* ------------------------------------------------------------------ */
  /* 5. Animated statistic counters                                      */
  /* ------------------------------------------------------------------ */
  (function statCounters() {
    var counters = qsa("[data-count]");
    if (!counters.length) return;

    var animateCounter = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (prefersReducedMotion) { el.textContent = target.toLocaleString("en-IN"); return; }

      var duration = 1600;
      var start = null;

      var step = function (timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        var current = Math.floor(eased * target);
        el.textContent = current.toLocaleString("en-IN");
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString("en-IN");
        }
      };

      window.requestAnimationFrame(step);
    };

    var statsSection = qs("#impact-stats");
    if (!statsSection) return;

    var hasRun = false;
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !hasRun) {
          hasRun = true;
          counters.forEach(animateCounter);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    observer.observe(statsSection);
  })();

  /* ------------------------------------------------------------------ */
  /* 6. Image fallback handling (broken/blocked hotlinked images)        */
  /* ------------------------------------------------------------------ */
  (function imageFallbacks() {
    // 'error' does not bubble, so we listen in the capture phase on window.
    window.addEventListener("error", function (e) {
      var target = e.target;
      if (!target || target.tagName !== "IMG" || !target.classList.contains("js-img")) return;
      var frame = target.closest(".img-frame") || target.closest(".gallery-item");
      if (frame) frame.classList.add("img-error");
    }, true);
  })();

  /* ------------------------------------------------------------------ */
  /* 7. Donation form — amount selection + custom amount + validation    */
  /* ------------------------------------------------------------------ */
  (function donationForm() {
    var form = qs("#donateForm");
    if (!form) return;

    var amountButtons = qsa(".amount-btn:not(.amount-btn--custom)", form);
    var customToggle = qs("#customAmountToggle", form);
    var customField = qs("#customAmountField");
    var customInput = qs("#customAmount");
    var display = qs("#selectedAmountDisplay");
    var selectedAmount = 500;

    var formatRupees = function (value) {
      return "₹" + Number(value || 0).toLocaleString("en-IN");
    };

    var selectPresetAmount = function (btn) {
      amountButtons.forEach(function (b) { b.classList.remove("is-selected"); });
      customToggle.classList.remove("is-selected");
      customField.hidden = true;
      btn.classList.add("is-selected");
      selectedAmount = parseInt(btn.getAttribute("data-amount"), 10);
      display.textContent = formatRupees(selectedAmount);
    };

    amountButtons.forEach(function (btn) {
      btn.addEventListener("click", function () { selectPresetAmount(btn); });
    });
    // Default selection
    if (amountButtons[0]) amountButtons[0].classList.add("is-selected");

    customToggle.addEventListener("click", function () {
      amountButtons.forEach(function (b) { b.classList.remove("is-selected"); });
      customToggle.classList.add("is-selected");
      customField.hidden = false;
      customInput.focus();
      var val = parseInt(customInput.value, 10);
      selectedAmount = val > 0 ? val : 0;
      display.textContent = formatRupees(selectedAmount);
    });

    customInput.addEventListener("input", function () {
      var val = parseInt(customInput.value, 10);
      selectedAmount = val > 0 ? val : 0;
      display.textContent = formatRupees(selectedAmount);
    });

    var setError = function (input, message) {
      var field = input.closest(".form-field");
      var errorEl = qs("#" + input.id + "Error");
      if (message) {
        field.classList.add("has-error");
        if (errorEl) errorEl.textContent = message;
        return false;
      }
      field.classList.remove("has-error");
      if (errorEl) errorEl.textContent = "";
      return true;
    };

    var isValidEmail = function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); };
    var isValidPhone = function (value) { return /^[0-9+()\-\s]{7,15}$/.test(value); };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nameInput = qs("#donorName");
      var emailInput = qs("#donorEmail");
      var phoneInput = qs("#donorPhone");

      var validName = setError(nameInput, nameInput.value.trim() ? "" : "Please enter your full name.");
      var validEmail = setError(emailInput, isValidEmail(emailInput.value.trim()) ? "" : "Please enter a valid email address.");
      var validPhone = setError(phoneInput, isValidPhone(phoneInput.value.trim()) ? "" : "Please enter a valid phone number.");
      var validAmount = selectedAmount > 0;

      if (!validAmount) {
        display.textContent = "Please choose an amount";
      }

      if (validName && validEmail && validPhone && validAmount) {
        // No backend exists on this static page — hand off to the
        // official, secure InAmigos Foundation Razorpay donation page.
        window.open("https://rzp.io/l/kWQ87HP", "_blank", "noopener");
      }
    });
  })();

  /* ------------------------------------------------------------------ */
  /* 8. Contact form — validation + mailto hand-off                      */
  /* ------------------------------------------------------------------ */
  (function contactForm() {
    var form = qs("#contactForm");
    if (!form) return;

    var isValidEmail = function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); };

    var setError = function (input, message) {
      var field = input.closest(".form-field");
      var errorEl = qs("#" + input.id + "Error");
      if (message) {
        field.classList.add("has-error");
        if (errorEl) errorEl.textContent = message;
        return false;
      }
      field.classList.remove("has-error");
      if (errorEl) errorEl.textContent = "";
      return true;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nameInput = qs("#contactName");
      var emailInput = qs("#contactEmail");
      var messageInput = qs("#contactMessage");
      var successEl = qs("#contactSuccess");

      var validName = setError(nameInput, nameInput.value.trim() ? "" : "Please enter your name.");
      var validEmail = setError(emailInput, isValidEmail(emailInput.value.trim()) ? "" : "Please enter a valid email address.");
      var validMessage = setError(messageInput, messageInput.value.trim() ? "" : "Please write a short message.");

      if (validName && validEmail && validMessage) {
        var subject = encodeURIComponent("Message from InAmigos Foundation website — " + nameInput.value.trim());
        var body = encodeURIComponent(
          messageInput.value.trim() +
          "\n\n— " + nameInput.value.trim() +
          "\n" + emailInput.value.trim()
        );
        window.location.href = "mailto:support@inamigosfoundation.org.in?subject=" + subject + "&body=" + body;
        if (successEl) successEl.hidden = false;
      }
    });
  })();

  /* ------------------------------------------------------------------ */
  /* 9. Gallery lightbox                                                  */
  /* ------------------------------------------------------------------ */
  (function galleryLightbox() {
    var items = qsa(".gallery-item");
    var lightbox = qs("#lightbox");
    if (!items.length || !lightbox) return;

    var imgEl = qs("#lightboxImg");
    var captionEl = qs("#lightboxCaption");
    var closeBtn = qs("#lightboxClose");
    var prevBtn = qs("#lightboxPrev");
    var nextBtn = qs("#lightboxNext");
    var currentIndex = 0;
    var lastFocused = null;

    var dataFor = function (index) {
      var item = items[index];
      var img = qs("img", item);
      return {
        src: img ? img.getAttribute("src") : "",
        caption: item.getAttribute("data-caption") || (img ? img.getAttribute("alt") : "")
      };
    };

    var render = function () {
      var data = dataFor(currentIndex);
      imgEl.src = data.src;
      imgEl.alt = data.caption;
      captionEl.textContent = data.caption;
    };

    var openLightbox = function (index) {
      currentIndex = index;
      lastFocused = document.activeElement;
      render();
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };

    var closeLightbox = function () {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      imgEl.src = "";
      if (lastFocused) lastFocused.focus();
    };

    var showNext = function () { currentIndex = (currentIndex + 1) % items.length; render(); };
    var showPrev = function () { currentIndex = (currentIndex - 1 + items.length) % items.length; render(); };

    items.forEach(function (item, index) {
      item.addEventListener("click", function () { openLightbox(index); });
    });

    closeBtn.addEventListener("click", closeLightbox);
    nextBtn.addEventListener("click", showNext);
    prevBtn.addEventListener("click", showPrev);

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard handling: Escape closes, arrows navigate
    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    });
  })();

  /* ------------------------------------------------------------------ */
  /* 10. Back-to-top button                                              */
  /* ------------------------------------------------------------------ */
  (function backToTop() {
    var btn = qs("#backToTop");
    if (!btn) return;

    var toggleVisibility = function () {
      if (window.scrollY > 480) {
        btn.classList.add("is-visible");
      } else {
        btn.classList.remove("is-visible");
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    toggleVisibility();

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  })();

});