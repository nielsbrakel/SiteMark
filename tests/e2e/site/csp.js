// Strict-CSP fixture: this same-origin script may run; inline styles and scripts may not, and
// Trusted Types reject plain strings in script sinks (REQ-SEC-007).
function trustedTypesEnforced() {
  const probe = document.createElement('script');
  try {
    probe.text = 'void 0';
    return false;
  } catch {
    return true;
  }
}

document.body.dataset.trustedTypes = trustedTypesEnforced() ? 'enforced' : 'off';
document.getElementById('status').textContent = 'The page script ran under the CSP.';
