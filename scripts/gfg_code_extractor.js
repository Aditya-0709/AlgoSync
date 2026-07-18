/**
 * GFG Code Extractor — runs in the MAIN world (page context).
 * Injected as a file-based <script src="..."> to bypass CSP.
 * Reads code from Ace / Monaco / CodeMirror editor APIs and
 * stores the result in a hidden DOM element for the content script.
 */
(function () {
  try {
    var code = '';

    // 1. Try Ace editor (GFG's primary editor)
    if (typeof ace !== 'undefined') {
      var aceEl =
        document.getElementById('ace-editor') ||
        document.querySelector('.ace_editor');
      if (aceEl) {
        try {
          code = ace.edit(aceEl).getValue();
        } catch (e) {
          /* ignore */
        }
      }
    }

    // 2. Try Monaco editor
    if (
      !code &&
      typeof monaco !== 'undefined' &&
      monaco.editor &&
      typeof monaco.editor.getModels === 'function'
    ) {
      var models = monaco.editor.getModels();
      if (models.length > 0) {
        code = models[0].getValue();
      }
    }

    // 3. Try CodeMirror
    if (!code) {
      var cm = document.querySelector('.CodeMirror');
      if (cm && cm.CodeMirror) {
        code = cm.CodeMirror.getValue();
      }
    }

    // Store the result in a hidden DOM element
    var existing = document.getElementById('leethub_code_data');
    if (existing) existing.remove();

    var pre = document.createElement('pre');
    pre.id = 'leethub_code_data';
    pre.style.display = 'none';
    pre.textContent = code || '';
    document.body.appendChild(pre);
  } catch (e) {
    var existing2 = document.getElementById('leethub_code_data');
    if (existing2) existing2.remove();

    var pre2 = document.createElement('pre');
    pre2.id = 'leethub_code_data';
    pre2.style.display = 'none';
    pre2.textContent = '';
    document.body.appendChild(pre2);
  }
})();
