// Dialog fixture: showModal() puts the dialog in the top layer, above a popover opened earlier.
const dialog = document.getElementById('dialog');
document.getElementById('open-dialog').addEventListener('click', () => dialog.showModal());
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
document.getElementById('dialog-confirm').addEventListener('click', () => dialog.close('confirm'));
