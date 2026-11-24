(function() {
  const links = [
    ['index', 'Docs'],
    ['assets', 'Assets'],
    ['tags', 'HTML Tags'],
    ['collision', 'Collision'],
    ['ui', 'UI Editor'],
    ['xml', 'XML Tools'],
    ['parkour', 'PK Tools'],
  ];
  const pageAliases = {
    audio: 'assets',
    image: 'assets',
  };
  const pageTitles = {
    index: 'TFM Lua Help',
    assets: 'TFM Asset Browser',
    audio: 'TFM Audios',
    image: 'TFM Images',
    tags: 'TFM HTML Tags',
    collision: 'TFM Collision Calculator',
    ui: 'TFM UI Editor',
    xml: 'TFM XML Tools',
    parkour: 'TFM Parkour Tools',
  };
  const credits = [
    ['Documentation', [
      ['In-game /luahelp command', null, 'Functions, events and the Lua tree'],
      ['Lua documentation', 'https://atelier801.com/topic?f=5&t=451587', 'Atelier 801 forum'],
      ['Module FAQ & Documentation', 'https://atelier801.com/topic?f=6&t=781139', 'Atelier 801 forum'],
      ['Lua 5.2 Reference Manual', 'https://www.lua.org/manual/5.2/manual.html', 'Standard library descriptions. Copyright 2011-2013 Lua.org, PUC-Rio'],
      ['Lua license', 'https://www.lua.org/license.html', 'Terms for the Lua manual content'],
      ['iforce2d - Collision filtering', 'https://www.iforce2d.net/b2dtut/collision-filtering', 'Collision Calculator'],
    ]],
    ['Assets', [
      ['Sound list on Atelier 801', 'http://audio.atelier801.com/sounds.html', 'Audio browser'],
    ]],
    ['Libraries', [
      ['Konva', 'https://konvajs.org/', 'UI Editor canvas'],
      ['Papa Parse', 'https://www.papaparse.com/', 'Parkour translations'],
      ['GitHub Buttons', 'https://buttons.github.io/', 'Star button'],
    ]],
    ['Project', [
      ['webninjasi/tfm-luahelp', 'https://github.com/webninjasi/tfm-luahelp', 'Source code'],
    ]],
  ];

  const page = (window.location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  const current = pageAliases[page] || page;
  const script = document.currentScript;

  const renderCredit = ([label, href, note]) => `
    <li>
      ${href ? `<a href="${href}" target="_blank" rel="noopener">${label}</a>` : `<b>${label}</b>`}
      <small>${note}</small>
    </li>
  `;

  script.insertAdjacentHTML('beforebegin', `
    <nav class="site-nav" aria-label="Tools">
      <h1 class="site-nav-brand">${pageTitles[page] || document.title}</h1>
      <button class="site-nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">&#9776;</button>
      <div class="site-nav-links">
        ${links.map(([href, label]) => `
          <a href="./${href}.html"${href == current ? ' class="active" aria-current="page"' : ''}>${label}</a>
        `).join('')}
      </div>
      <div class="site-nav-end">
        <button class="site-nav-credits" type="button">Credits</button>
        <span class="site-nav-star">
          <a class="github-button" href="https://github.com/webninjasi/tfm-luahelp" data-color-scheme="no-preference: dark_dimmed; light: light; dark: dark_dimmed;" data-icon="octicon-star" data-size="large" aria-label="Star webninjasi/tfm-luahelp on GitHub">Github</a>
        </span>
      </div>
    </nav>
  `);

  const nav = script.previousElementSibling;
  const navToggle = nav.querySelector('.site-nav-toggle');

  navToggle.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', nav.classList.toggle('open'));
  });

  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.setAttribute('aria-label', 'Credits and sources');
  dialog.innerHTML = `
    <div class="dialog-head">
      <h2>Credits &amp; Sources</h2>
      <button type="button" class="dialog-close" aria-label="Close">&times;</button>
    </div>
    <div class="dialog-body credits-body">
      ${credits.map(([title, items]) => `
        <section>
          <h3>${title}</h3>
          <ul>${items.map(renderCredit).join('')}</ul>
        </section>
      `).join('')}
    </div>
  `;

  window.addEventListener('DOMContentLoaded', () => document.body.appendChild(dialog));

  nav.querySelector('.site-nav-credits').addEventListener('click', () => dialog.showModal());
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target == dialog) {
      dialog.close();
    }
  });

  const buttons = document.createElement('script');
  buttons.src = 'https://buttons.github.io/buttons.js';
  buttons.async = true;
  document.head.appendChild(buttons);
})();
