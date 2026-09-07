function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

// Prettier formats a template tagged html and no other, which is all this is for.
function html(strings, ...values) {
  return strings.reduce((markup, part, index) => markup + values[index - 1] + part)
}

export { escapeHtml, html }
