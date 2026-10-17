(() => {
  "use strict";

  function enhancePublications() {
    const publications = Array.from(document.querySelectorAll(".publication"));
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
    const searchInput = document.getElementById("publication-search");
    const status = document.getElementById("publication-status");
    const emptyState = document.getElementById("publication-empty");

    if (!publications.length || !filterButtons.length) return;

    const searchText = new Map(
      publications.map((publication) => [
        publication,
        publication.textContent.replace(/\s+/g, " ").toLowerCase(),
      ]),
    );
    let activeFilter = "all";

    filterButtons.forEach((button) => {
      const count = button.querySelector(".filter-count");
      if (count) {
        count.textContent = String(
          publications.filter(
            (publication) =>
              button.dataset.filter === "all" ||
              publication.dataset.type === button.dataset.filter,
          ).length,
        );
      }
    });

    function updateResults() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      let visibleCount = 0;

      publications.forEach((publication) => {
        const matchesType =
          activeFilter === "all" || publication.dataset.type === activeFilter;
        const matchesSearch = searchText.get(publication).includes(query);
        publication.hidden = !(matchesType && matchesSearch);
        if (!publication.hidden) visibleCount += 1;
      });

      filterButtons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === activeFilter),
        );
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
      if (status) {
        status.textContent = `${visibleCount} publication${visibleCount === 1 ? "" : "s"} shown.`;
      }
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextFilter = button.dataset.filter;
        if (!["all", "journal", "conference"].includes(nextFilter)) return;
        activeFilter = nextFilter;
        updateResults();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", updateResults);
      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && searchInput.value) {
          event.preventDefault();
          searchInput.value = "";
          updateResults();
        }
      });
    }

    updateResults();
  }

  function enhanceNavigation() {
    const links = Array.from(document.querySelectorAll(".nav-link[href^='#']"));
    const sections = links
      .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
      .filter(Boolean);

    if (!sections.length) return;

    function setCurrentSection(sectionId) {
      links.forEach((link) => {
        if (link.getAttribute("href") === `#${sectionId}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function updateFromHash() {
      const section = sections.find((item) => `#${item.id}` === window.location.hash);
      if (section) setCurrentSection(section.id);
    }

    setCurrentSection(sections[0].id);
    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);

    if (!("IntersectionObserver" in window)) return;

    const visibleSections = new Set();
    let observer = null;
    let observedHeight = 0;

    function observeSections() {
      const viewportHeight = window.innerHeight;
      if (observer && observedHeight === viewportHeight) return;
      observedHeight = viewportHeight;
      if (observer) observer.disconnect();
      visibleSections.clear();

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.add(entry.target);
            } else {
              visibleSections.delete(entry.target);
            }
          });

          if (!visibleSections.size) return;

          const readingLine = window.innerHeight * 0.25;
          const candidates = Array.from(visibleSections);
          const currentSection = candidates.find((section) => {
            const bounds = section.getBoundingClientRect();
            return bounds.top <= readingLine && bounds.bottom >= readingLine;
          }) || candidates.sort(
            (first, second) =>
              Math.abs(first.getBoundingClientRect().top - readingLine) -
              Math.abs(second.getBoundingClientRect().top - readingLine),
          )[0];
          setCurrentSection(currentSection.id);
        },
        {
          rootMargin: `-${Math.round(viewportHeight * 0.15)}px 0px -${Math.round(viewportHeight * 0.6)}px 0px`,
          threshold: [0, 0.15, 0.35, 0.6, 1],
        },
      );

      sections.forEach((section) => observer.observe(section));
    }

    observeSections();
    window.addEventListener("resize", observeSections);
    window.addEventListener("orientationchange", observeSections);
  }

  function initialize() {
    enhancePublications();
    enhanceNavigation();
    document.documentElement.classList.add("is-enhanced");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
