// Fullscreen fixture: requestFullscreen() needs a user gesture, so tests click the button.
const stage = document.getElementById('stage');
document.getElementById('enter-fullscreen').addEventListener('click', () => {
  stage.requestFullscreen().catch(() => {
    document.body.dataset.fullscreen = 'denied';
  });
});
document.getElementById('exit-fullscreen').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
});
