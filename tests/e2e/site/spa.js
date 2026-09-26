// SPA fixture: client-side routing with history.pushState/replaceState, a title per route and a
// route-specific element, like the apps SiteMark's URL watch has to follow (docs/plan.md §3.3).
const views = {
  overview: { title: 'Overview', text: 'Nothing to see here.' },
  orders: { title: 'Orders', text: 'Three open orders.', action: 'Refund order' },
  settings: { title: 'Settings', text: 'Account settings.', action: 'Delete account' },
};

function viewOf(pathname) {
  const name = pathname.replace(/^\/spa\/?/, '').split('/')[0];
  return Object.hasOwn(views, name) ? name : 'overview';
}

function render() {
  const name = viewOf(location.pathname);
  const view = views[name];
  document.title = `${view.title} · SPA fixture`;
  const heading = document.createElement('h1');
  heading.textContent = view.title;
  const text = document.createElement('p');
  text.textContent = view.text;
  const main = document.getElementById('view');
  main.replaceChildren(heading, text);
  if (view.action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.testid = `${name}-action`;
    button.textContent = view.action;
    main.append(button);
  }
}

document.addEventListener('click', (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[data-route]') : null;
  if (!link) return;
  event.preventDefault();
  history.pushState({}, '', link.getAttribute('href'));
  render();
});

document.getElementById('replace-state').addEventListener('click', () => {
  history.replaceState({}, '', '/spa/settings');
  render();
});

window.addEventListener('popstate', render);
render();
