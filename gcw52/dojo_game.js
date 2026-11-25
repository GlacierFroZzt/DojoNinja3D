Promise.all([
  fetch('c1.js').then(r => r.text()),
  fetch('c2.js').then(r => r.text()),
  fetch('c3.js').then(r => r.text()),
  fetch('c4.js').then(r => r.text()),
  fetch('c5.js').then(r => r.text()),
  fetch('c6.js').then(r => r.text())
]).then(parts => {
  const code = parts.join('\n');
  const blob = new Blob([code], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  import(url);
});