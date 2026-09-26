// Lazy-content fixture: an element that appears late, and can be removed, re-added and moved
// (element marks must find it and follow it, REQ-RND-003).
const delay = Number(new URLSearchParams(location.search).get('delay') ?? 1000);
const slotA = document.getElementById('slot-a');
const slotB = document.getElementById('slot-b');

function target() {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'lazy-action';
  button.dataset.testid = 'lazy-action';
  button.textContent = 'Lazy action';
  return button;
}

setTimeout(() => slotA.append(target()), delay);

document.getElementById('remove-target').addEventListener('click', () => {
  document.getElementById('lazy-action')?.remove();
});
document.getElementById('add-target').addEventListener('click', () => {
  if (!document.getElementById('lazy-action')) slotA.append(target());
});
document.getElementById('move-target').addEventListener('click', () => {
  const button = document.getElementById('lazy-action');
  if (button) (button.parentElement === slotA ? slotB : slotA).append(button);
});
