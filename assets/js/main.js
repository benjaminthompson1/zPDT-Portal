/* ==========================================================================
   zADE Portal — Main JavaScript
   Served as a static resource from the Liberty WAR root.
   No inline scripts: this file is referenced with <script defer> in index.html,
   allowing a stricter Content-Security-Policy (script-src 'self').
   ========================================================================== */

(function () {
  'use strict';

  /* ── Global error handling ── */
  window.addEventListener('error', function (e) {
    if (!e.filename || !e.filename.includes('status')) {
      showNotification('An unexpected error occurred. Please try again.', 'error');
    }
  });

  window.addEventListener('unhandledrejection', function (e) {
    if (!e.reason || !String(e.reason.message).includes('status')) {
      showNotification('A background operation failed. Please try again.', 'error');
    }
    e.preventDefault();
  });

  /* ── Notifications ── */
  /**
   * Display a toast notification to the user
   * @param {string} message - The message to display
   * @param {string} [type='success'] - Notification type: 'success' or 'error'
   */
  function showNotification(message, type) {
    type = type || 'success';
    var container = document.getElementById('notification-container');
    if (!container) return;
    var n = document.createElement('div');
    n.className = 'notification ' + type;
    n.textContent = message;
    container.appendChild(n);
    n.offsetHeight; // force reflow to trigger CSS transition
    n.classList.add('show');
    setTimeout(function () {
      n.classList.remove('show');
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 300);
    }, 4000);
  }

  /* ── Hamburger menu ── */
  /**
   * Initialize hamburger menu for mobile navigation
   * Includes auto-close on link click and outside click
   */
  function initHamburger() {
    var hamburger = document.getElementById('hamburger');
    var nav = document.getElementById('nav');
    if (!hamburger || !nav) return;

    function toggleMenu() {
      var open = nav.classList.toggle('show');
      hamburger.setAttribute('aria-expanded', String(open));
    }

    hamburger.addEventListener('click', toggleMenu);
    
    // Close menu when clicking a nav link (mobile)
    var navLinks = nav.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (nav.classList.contains('show')) {
          toggleMenu();
        }
      });
    });
    
    // Close menu when clicking outside (mobile)
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('show') &&
          !nav.contains(e.target) &&
          !hamburger.contains(e.target)) {
        toggleMenu();
      }
    });
  }

  /* ── Scroll: spy + back-to-top visibility ──
     Combined into a single scroll listener with requestAnimationFrame throttling. */
  /**
   * Initialize scroll-based features with performance optimization
   * Uses requestAnimationFrame to throttle scroll events
   */
  function initScroll() {
    var sections  = document.querySelectorAll('section.section');
    var navLinks  = document.querySelectorAll('.shell-header-nav a');
    var backToTop = document.getElementById('back-to-top');
    var ticking = false;

    function updateScroll() {
      var y = window.scrollY;

      /* Scroll-spy: highlight the nav link whose section is in view */
      var current = '';
      sections.forEach(function (sec) {
        if (y >= sec.offsetTop - 80) current = sec.id;
      });
      navLinks.forEach(function (link) {
        link.removeAttribute('aria-current');
        if (link.getAttribute('href') === '#' + current) {
          link.setAttribute('aria-current', 'true');
        }
      });

      /* Show/hide the back-to-top button after scrolling 400 px */
      if (backToTop) {
        if (y > 400) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      }
      
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    });

    /* Back-to-top click */
    if (backToTop) {
      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ── Service status checker ── */
  /**
   * Check if a service endpoint is reachable
   * @param {string} url - The service URL to check
   * @param {string} id - The DOM element ID for the status indicator
   * @param {number} [timeout=8000] - Request timeout in milliseconds
   * @returns {Promise<void>}
   */
  async function checkService(url, id, timeout) {
    timeout = timeout || 8000;
    var el = document.getElementById(id);
    if (!el) return;

    el.className = 'status-dot loading';
    el.title = 'Checking status\u2026';

    /* Try HEAD first (cheap), fall back to GET (some servers reject HEAD) */
    var reached = false;
    var lastError = null;
    
    for (var method of ['HEAD', 'GET']) {
      if (reached) break;
      try {
        var ctrl = new AbortController();
        var tid  = setTimeout(function () { ctrl.abort(); }, timeout);
        await fetch(url, { method: method, mode: 'no-cors', signal: ctrl.signal });
        clearTimeout(tid);
        reached = true;
      } catch (err) {
        lastError = err;
      }
    }

    if (reached) {
      el.className = 'status-dot up';
      el.title = 'Service appears to be reachable';
    } else {
      el.className = 'status-dot down';
      // More specific error message
      if (lastError && lastError.name === 'AbortError') {
        el.title = 'Service timeout (>' + (timeout/1000) + 's)';
      } else {
        el.title = 'Service unreachable';
      }
    }
  }

  var SERVICE_LIST = [
    { url: 'https://s0w1.dal-ebis.ihost.com:10443/zosmf/LogOnPanel.jsp',                                        id: 'zosmf-status'          },
    { url: 'https://s0w1.dal-ebis.ihost.com:7554/zlux/ui/v1/ZLUX/plugins/org.zowe.zlux.bootstrap/web/',        id: 'zowe-status'           },
    { url: 'https://guac.mainframehome.net/#/',                                                                  id: 'guac-status'           },
    { url: 'https://minio.mainframehome.net/browser',                                                            id: 'minio-status'          },
    { url: 'https://zcee3.mainframehome.net/items?startItemID=10',                                               id: 'catalog-list-status'   },
    { url: 'https://zcee3.mainframehome.net/items/10',                                                           id: 'catalog-single-status' },
    { url: 'https://zcee3.mainframehome.net/employees/000010',                                                   id: 'employee-single-status'},
    { url: 'https://zcee3.mainframehome.net/employees?department=A00&job=PRES%20%20%20%20',                     id: 'employee-query-status' },
  ];

  /**
   * Load cached service status from localStorage
   * @returns {boolean} True if cached data was loaded successfully
   */
  function loadCachedStatus() {
    try {
      var cached = JSON.parse(localStorage.getItem('serviceStatus'));
      if (cached && (Date.now() - cached.timestamp < 300000)) { // 5 min cache
        cached.statuses.forEach(function (s) {
          var el = document.getElementById(s.id);
          if (el) {
            el.className = 'status-dot ' + s.status;
            el.title = s.title;
          }
        });
        var lastCheckedEl = document.getElementById('last-checked-status');
        if (lastCheckedEl) {
          lastCheckedEl.textContent = 'Last checked: ' + new Date(cached.timestamp).toLocaleTimeString() + ' (cached)';
        }
        return true;
      }
    } catch (e) { /* ignore localStorage errors */ }
    return false;
  }

  /**
   * Save current service status to localStorage
   */
  function saveCachedStatus() {
    try {
      var statuses = SERVICE_LIST.map(function (svc) {
        var el = document.getElementById(svc.id);
        return {
          id: svc.id,
          status: el.className.replace('status-dot ', ''),
          title: el.title
        };
      });
      localStorage.setItem('serviceStatus', JSON.stringify({
        timestamp: Date.now(),
        statuses: statuses
      }));
    } catch (e) { /* ignore localStorage errors */ }
  }

  /**
   * Check all services sequentially with progress updates
   * @returns {Promise<void>}
   */
  async function checkAllServices() {
    /* Reset all dots to loading */
    SERVICE_LIST.forEach(function (svc) {
      var el = document.getElementById(svc.id);
      if (el) { el.className = 'status-dot loading'; el.title = 'Checking status\u2026'; }
    });

    var btn           = document.getElementById('refresh-btn');
    var lastCheckedEl = document.getElementById('last-checked-status');

    if (btn) { btn.disabled = true; btn.classList.add('spinning'); }
    
    if (lastCheckedEl) {
      lastCheckedEl.textContent = 'Checking services...';
    }

    /* Check services sequentially to avoid hammering the network */
    var total = SERVICE_LIST.length;
    var checked = 0;
    
    for (var svc of SERVICE_LIST) {
      await checkService(svc.url, svc.id);
      checked++;
      if (lastCheckedEl) {
        lastCheckedEl.textContent = 'Checking ' + checked + '/' + total + '...';
      }
    }

    if (btn) { btn.disabled = false; btn.classList.remove('spinning'); }
    if (lastCheckedEl) {
      lastCheckedEl.textContent = 'Last checked: ' + new Date().toLocaleTimeString();
    }
    
    // Save status to cache
    saveCachedStatus();
  }

  /* ── Modal wiring (shared by Help and Lab Info) ── */
  /**
   * Initialize modal dialog functionality
   * @param {string} triggerId - ID of the button that opens the modal
   * @param {string} modalId - ID of the modal overlay element
   * @param {string} closeBtnId - ID of the close button inside the modal
   */
  function initModal(triggerId, modalId, closeBtnId) {
    var trigger  = document.getElementById(triggerId);
    var modal    = document.getElementById(modalId);
    var closeBtn = document.getElementById(closeBtnId);
    if (!trigger || !modal || !closeBtn) return;

    function openModal() {
      modal.hidden = false;
      modal.classList.add('visible');
      closeBtn.focus();
    }

    function closeModal() {
      modal.classList.remove('visible');
      setTimeout(function () { modal.hidden = true; }, 250);
      trigger.focus();
    }

    trigger.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

  /* ── Copy-to-clipboard for API endpoint buttons ── */
  /**
   * Initialize copy-to-clipboard functionality for API endpoint buttons
   */
  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var text = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(function () {
          btn.classList.add('copied');
          var icon = btn.querySelector('i');
          if (icon) { icon.className = 'fas fa-check'; }
          setTimeout(function () {
            btn.classList.remove('copied');
            if (icon) { icon.className = 'fas fa-copy'; }
          }, 2000);
        }).catch(function () {
          showNotification('Could not copy to clipboard.', 'error');
        });
      });
    });
  }

  /* ── Keyboard shortcuts ── */
  /**
   * Initialize global keyboard shortcuts
   * Alt+H: Open Help modal
   * Alt+I: Open Lab Info modal
   * Alt+R: Refresh service status
   */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Alt+H for Help modal
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        var helpBtn = document.getElementById('help-btn');
        if (helpBtn) helpBtn.click();
      }
      
      // Alt+I for Lab Info modal
      if (e.altKey && e.key === 'i') {
        e.preventDefault();
        var labinfoBtn = document.getElementById('labinfo-btn');
        if (labinfoBtn) labinfoBtn.click();
      }
      
      // Alt+R for Refresh status
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        var refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn && !refreshBtn.disabled) {
          refreshBtn.click();
        }
      }
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    initHamburger();
    initModal('help-btn', 'help-modal', 'help-close-btn');
    initModal('labinfo-btn', 'labinfo-modal', 'labinfo-close-btn');
    initScroll();
    initCopyButtons();
    initKeyboardShortcuts();
    
    // Load cached status first for instant feedback
    var hasCached = loadCachedStatus();
    
    // Then check all services (will update cache)
    if (!hasCached) {
      checkAllServices();
    } else {
      // If we have cache, still check in background after a short delay
      setTimeout(checkAllServices, 2000);
    }

    var lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = 'Page loaded: ' + new Date().toLocaleString();
    }

    var refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', checkAllServices);
    }
  });

}());
