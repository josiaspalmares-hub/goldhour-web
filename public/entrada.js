try {
  if (sessionStorage.getItem('gh-entrada')) document.documentElement.classList.add('entrada-vista');
  else sessionStorage.setItem('gh-entrada', '1');
} catch (e) {
  // Sin almacenamiento: se muestra igual
  if (!(e instanceof DOMException)) throw e;
}
