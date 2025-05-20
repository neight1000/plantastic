// Plantastic Project Versions List (used for project-list.html)

const projectData = [
  {
    number: 1,
    title: "Initial: Original index.html in repository",
    description: "The starting version before any improvements. This is the file as it existed in neight1000/Grooves at the start of the session."
  },
  {
    number: 2,
    title: "Refactor: Split into index.html, style.css, main.js with improvements",
    description: "Suggested improvements including external CSS and JS, semantic HTML, accessibility, and meta tags. Provided code for all three files."
  },
  {
    number: 3,
    title: "Hotfix: main.js wrapped in window.onload",
    description: "Addressed missing functionality by ensuring JavaScript runs after DOM loads. Provided fixed main.js code."
  },
  {
    number: 4,
    title: "Final: Complete HTML with external links",
    description: "Provided a single working index.html that links to style.css and main.js, ensuring all files work together."
  },
  {
    number: 5,
    title: "Plantasia Instrumentation (app.js)",
    description: "Implemented full JavaScript logic for Plantasia-style synth, visuals, and MIDI support. Provided a comprehensive and organized app.js."
  },
  {
    number: 6,
    title: "Navigation-Only Index Page",
    description: "Created a minimal index.html with navigation to the project list, removing the synth app from the landing page."
  },
  {
    number: 7,
    title: "Comprehensive Project List Page",
    description: "This page! Lists all project milestones and their descriptions with navigation for easy browsing."
  }
];

window.onload = function() {
  const list = document.getElementById('project-list');
  if (!list) return;
  projectData.forEach(item => {
    const li = document.createElement('li');
    li.className = 'project-item';
    li.innerHTML = `
      <span class="project-number">#${item.number}</span>
      <span class="project-title">${item.title}</span>
      <div class="project-description">${item.description}</div>
    `;
    list.appendChild(li);
  });
};
