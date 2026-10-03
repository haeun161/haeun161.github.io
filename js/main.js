const themeButton = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector(".theme-icon");
const currentYear = document.querySelector("#current-year");
const themeColor = document.querySelector('meta[name="theme-color"]');
const sectionNav = document.querySelector(".section-nav");
const navButton = document.querySelector("#nav-current");
const navList = document.querySelector("#nav-list");
const currentSectionName = document.querySelector("#current-section-name");
const sectionLinks = [...navList.querySelectorAll("a")];
const publicationSearch = document.querySelector("#publication-search");
const publicationTabs = [...document.querySelectorAll(".publication-tab")];
const publicationPanels = [...document.querySelectorAll(".publication-panel")];
const imagePreviewDialog = document.querySelector("#image-preview-dialog");
const imagePreviewContent = document.querySelector("#image-preview-content");
const imagePreviewClose = document.querySelector("#image-preview-close");
const dataStatus = document.querySelector("#data-status");

currentYear.textContent = new Date().getFullYear();

function closeSectionMenu() {
  navList.hidden = true;
  navButton.setAttribute("aria-expanded", "false");
}

navButton.addEventListener("click", () => {
  const isExpanded = navButton.getAttribute("aria-expanded") === "true";
  navButton.setAttribute("aria-expanded", String(!isExpanded));
  navList.hidden = isExpanded;
});

sectionLinks.forEach((link) => {
  link.addEventListener("click", () => {
    currentSectionName.textContent = link.textContent;
    closeSectionMenu();
  });
});

document.addEventListener("click", (event) => {
  if (!sectionNav.contains(event.target)) closeSectionMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !navList.hidden) {
    closeSectionMenu();
    navButton.focus();
  }
});

const sectionObserver = new IntersectionObserver((entries) => {
  const visibleSection = entries.find((entry) => entry.isIntersecting);
  if (!visibleSection) return;

  const activeLink = sectionLinks.find((link) => link.hash === `#${visibleSection.target.id}`);
  if (!activeLink) return;

  currentSectionName.textContent = activeLink.textContent;
  sectionLinks.forEach((link) => {
    if (link === activeLink) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}, { rootMargin: "-20% 0px -65% 0px" });

sectionLinks.forEach((link) => {
  const section = document.querySelector(link.hash);
  if (section) sectionObserver.observe(section);
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeIcon.textContent = theme === "dark" ? "☀" : "☾";
  themeButton.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
  );
  themeColor.content = theme === "dark" ? "#050505" : "#f5f7fa";
}

let savedTheme;
try {
  savedTheme = localStorage.getItem("profile-theme");
} catch {
  savedTheme = null;
}

const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferredTheme);

themeButton.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  try {
    localStorage.setItem("profile-theme", nextTheme);
  } catch {
    // The selected theme still applies when storage is unavailable.
  }
});

function filterVisiblePublications() {
  const query = publicationSearch.value.trim().toLocaleLowerCase();
  document.querySelectorAll(".publication-panel:not([hidden]) .publication-item").forEach((item) => {
    item.hidden = !item.textContent.toLocaleLowerCase().includes(query);
  });
}

function selectPublicationTab(tab) {
  const selectedPanelId = tab.getAttribute("aria-controls");
  publicationTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  publicationPanels.forEach((panel) => {
    panel.hidden = panel.id !== selectedPanelId;
  });
  publicationSearch.placeholder = selectedPanelId === "papers-panel" ? "Search papers" : "Search patents";
  filterVisiblePublications();
}

publicationTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectPublicationTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? publicationTabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + publicationTabs.length) % publicationTabs.length;
    publicationTabs[nextIndex].focus();
    selectPublicationTab(publicationTabs[nextIndex]);
  });
});

publicationSearch.addEventListener("input", filterVisiblePublications);

let imagePreviewTrigger;
document.querySelector("#papers-list").addEventListener("click", (event) => {
  const trigger = event.target.closest(".publication-image-trigger");
  if (!trigger) return;

  const image = trigger.querySelector("img");
  imagePreviewTrigger = trigger;
  imagePreviewContent.src = image.currentSrc || image.src;
  imagePreviewContent.alt = image.alt;
  imagePreviewDialog.showModal();
});

imagePreviewClose.addEventListener("click", () => imagePreviewDialog.close());
imagePreviewDialog.addEventListener("click", (event) => {
  if (event.target === imagePreviewDialog) imagePreviewDialog.close();
});
imagePreviewDialog.addEventListener("close", () => imagePreviewTrigger?.focus());

async function loadJson(path) {
  const response = await fetch(`data/${path}`);
  if (!response.ok) throw new Error(`Could not load data/${path}: ${response.status}`);
  return response.json();
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text ?? "";
  return element;
}

function appendHighlightedNames(element, text) {
  const namePattern = /Haeun Lee|이하은/gi;
  let previousIndex = 0;

  for (const match of text.matchAll(namePattern)) {
    element.append(document.createTextNode(text.slice(previousIndex, match.index)));
    const name = textElement("strong", "", match[0]);
    element.append(name);
    previousIndex = match.index + match[0].length;
  }

  element.append(document.createTextNode(text.slice(previousIndex)));
}

function makeExternalLink(label, url, className = "") {
  if (!url) return null;
  const link = textElement("a", className, label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function renderProfile(profile) {
  const heading = document.querySelector("#profile-name");
  heading.prepend(document.createTextNode(profile.name));
  document.querySelector("#profile-role").textContent = profile.role;
  document.querySelector("#profile-affiliation").textContent = profile.affiliation;
  document.querySelector("#profile-location").textContent = profile.location ?? "";
  document.title = `${profile.name} | Personal Profile`;

  const photo = document.querySelector("#profile-photo");
  photo.src = profile.photo;
  photo.alt = `Portrait of ${profile.name}`;

  const links = document.querySelector("#profile-links");
  const scholarProfileLink = document.querySelector("#scholar-profile-link");
  profile.links.forEach(({ label, url }) => {
    const link = makeExternalLink(label, url);
    if (!link) return;
    if (label === "Google Scholar") {
      scholarProfileLink.href = url;
      scholarProfileLink.hidden = false;
    }
    link.append(textElement("span", "", "↗"));
    link.lastElementChild.setAttribute("aria-hidden", "true");
    links.append(link);
  });

}

function renderResearch(research) {
  document.querySelector("#research-lead").textContent = research.lead;
  document.querySelector("#research-summary").textContent = research.summary;
  document.querySelector('meta[name="description"]').content = research.summary;

  const interestList = document.querySelector("#interest-list");
  research.interests.forEach((interest) => {
    interestList.append(textElement("li", "", interest));
  });
}

function renderExperience(experiences) {
  const timeline = document.querySelector("#timeline-experience");
  experiences.forEach((experience) => {
    const card = textElement("article", "timeline-item");
    const logo = textElement("div", "experience-logo-placeholder", "Logo");
    logo.setAttribute("aria-hidden", "true");

    if (experience.logo) {
      const image = document.createElement("img");
      image.className = "experience-logo";
      image.src = experience.logo;
      image.alt = `${experience.organization} logo`;
      logo.replaceChildren(image);
    }

    const body = textElement("div", "timeline-body");
    body.append(textElement("h3", "", experience.organization));
    body.append(textElement("p", "timeline-title", experience.role));
    body.append(textElement("p", "time-range", experience.period));
    body.append(textElement("p", "timeline-description", experience.description));
    if (experience.highlights?.length) {
      const highlights = textElement("ul", "experience-highlights");
      experience.highlights.forEach((highlight) => {
        highlights.append(textElement("li", "", highlight));
      });
      body.append(highlights);
    }
    card.append(logo, body);
    timeline.append(card);
  });
}

function renderEducation(educationEntries) {
  const list = document.querySelector("#education-list");
  educationEntries.forEach((education) => {
    const card = textElement("article", "education-item");

    const logo = textElement("div", "education-logo-placeholder", "Logo");
    logo.setAttribute("aria-hidden", "true");
    if (education.logo) {
      const image = document.createElement("img");
      image.className = "education-logo";
      image.src = education.logo;
      image.alt = `${education.institution} logo`;
      logo.replaceChildren(image);
    }

    const details = textElement("div", "");
    details.append(textElement("span", "education-year", education.period));
    details.append(textElement("h3", "", education.institution));
    details.append(textElement("p", "", education.degree));
    if (education.highlights?.length) {
      const highlights = textElement("ul", "education-highlights");
      education.highlights.forEach((highlight) => {
        highlights.append(textElement("li", "", highlight));
      });
      details.append(highlights);
    }

    card.append(logo, details);
    list.append(card);
  });
}

function renderProjects(projects) {
  const list = document.querySelector("#projects-list");
  projects.forEach((project) => {
    const card = textElement("article", "work-card");
    const top = textElement("div", "work-card-top");
    top.append(textElement("span", "", project.category));
    const mark = textElement("span", "", "↗");
    mark.setAttribute("aria-hidden", "true");
    top.append(mark);
    card.append(top, textElement("h3", "", project.title));
    card.append(textElement("p", "", project.description));

    const tags = textElement("ul", "work-tags");
    tags.setAttribute("aria-label", "Technologies and topics");
    project.tags.forEach((tag) => tags.append(textElement("li", "", tag)));
    card.append(tags);

    const link = makeExternalLink(project.linkLabel, project.url, "work-link");
    if (link) {
      link.append(textElement("span", "", "→"));
      link.lastElementChild.setAttribute("aria-hidden", "true");
      card.append(link);
    }
    list.append(card);
  });
}

function renderPublications(publications, listId, type) {
  const list = document.querySelector(`#${listId}`);
  publications.forEach((publication) => {
    const card = textElement("article", "publication-item");
    const media = textElement("div", "publication-media");

    if (publication.image && publication.image.toLowerCase().endsWith(".pdf")) {
      const preview = document.createElement("iframe");
      preview.className = "publication-pdf-preview";
      preview.src = `${publication.image}#page=1&toolbar=0&navpanes=0&view=FitH`;
      preview.title = `PDF preview: ${publication.title}`;
      preview.loading = "lazy";
      media.append(preview);
    } else if (publication.image) {
      const trigger = textElement("button", "publication-image-trigger");
      trigger.type = "button";
      trigger.setAttribute("aria-label", `Enlarge image: ${publication.title}`);
      const image = document.createElement("img");
      image.className = "publication-thumbnail";
      image.src = publication.image;
      image.alt = `${publication.title} preview`;
      trigger.append(image);
      media.append(trigger);
    } else {
      media.append(textElement("span", "", type === "paper" ? "Paper image" : "Patent"));
    }

    const details = textElement("div", "publication-copy");
    const metadata = type === "paper"
      ? publication.venue
      : `${publication.status} · ${publication.year} · ${publication.applicationNumber}`;
    const contributors = type === "paper"
      ? publication.authors
      : `Inventors: ${publication.inventors}`;
    const description = type === "paper" ? publication.abstract : publication.description;
    details.append(textElement("p", "publication-venue", metadata));
    details.append(textElement("h3", "", publication.title));
    const contributorsElement = textElement("p", "publication-authors", "");
    appendHighlightedNames(contributorsElement, contributors);
    details.append(contributorsElement);
    details.append(textElement("p", "publication-abstract", description));

    const links = textElement("div", "publication-links");
    publication.links.forEach(({ label, url }) => {
      const link = makeExternalLink(`${label} ↗`, url);
      if (link) links.append(link);
    });
    if (links.childElementCount) details.append(links);

    card.append(media, details);
    list.append(card);
  });
}

async function loadSiteData() {
  try {
    const manifest = await loadJson("manifest.json");
    const [profile, research, experience, education, papers, patents] = await Promise.all([
      loadJson(manifest.profile),
      loadJson(manifest.research),
      Promise.all(manifest.experience.map(loadJson)),
      Promise.all(manifest.education.map(loadJson)),
      Promise.all(manifest.papers.map(loadJson)),
      Promise.all(manifest.patents.map(loadJson)),
    ]);

    renderProfile(profile);
    renderResearch(research);
    renderExperience(experience);
    renderEducation(education);
    renderPublications(papers, "papers-list", "paper");
    renderPublications(patents, "patents-list", "patent");
    selectPublicationTab(publicationTabs[0]);
  } catch (error) {
    console.error(error);
    dataStatus.textContent = "Profile data could not be loaded. Open this page through a local web server.";
  }
}

loadSiteData();
