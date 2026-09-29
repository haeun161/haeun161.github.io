# Profile data

Edit the JSON files here to update the site. `manifest.json` lists which files are loaded.

- `profile.json` contains the name, role, links, portrait path, and personal interests.
- `research.json` contains the research introduction and interest tags.
- Each experience, education entry, project, paper, and patent has its own JSON file in its matching folder.
- To add an entry, duplicate a JSON file in that folder and add its relative path to the matching array (`experience`, `education`, `projects`, `papers`, or `patents`) in `manifest.json`.
- Paper and patent entries appear under separate tabs in the Publications section.
- For a paper image, add the image under `assets/` and set its path in the paper JSON. Leave a link URL empty to hide that link.

The page shell is in `../index.html`; `../js/main.js` loads and renders the data files.