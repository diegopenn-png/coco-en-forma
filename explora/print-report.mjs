// Called only after the completed, authorised report is on screen.
export function enableLocalizedPrint(report) {
  const controls = report.querySelector('#download-panel');
  const journal = report.querySelector('#notes');
  const print = document.createElement('button');
  print.type = 'button';
  controls.prepend(print);
  const reflection = document.createElement('p');
  reflection.className = 'printed-reflection';
  reflection.setAttribute('data-coco-verbatim','');
  journal.after(reflection);
  const expanded = new Set();
  function sync() {
    const locale = window.CocoLocale;
    const localized = locale && locale.tag !== 'es';
    print.hidden = !localized;
    const pageCount=report.querySelector('[data-original-page-count]');
    if(pageCount)pageCount.hidden=Boolean(localized);
    print.textContent = locale?.t('Imprimir o guardar como PDF') || 'Imprimir o guardar como PDF';
  }
  function prepare() {
    reflection.textContent = journal.value;
    for (const detail of report.querySelectorAll('details:not([open])')) {
      expanded.add(detail); detail.open = true;
    }
  }
  function restore() {
    for (const detail of expanded) detail.open = false;
    expanded.clear();
  }
  print.onclick = () => { prepare(); window.print(); };
  sync();
  const events = new AbortController();
  window.addEventListener('coco:language',sync,{signal:events.signal});
  window.addEventListener('beforeprint',prepare,{signal:events.signal});
  window.addEventListener('afterprint',restore,{signal:events.signal});
  return () => { restore(); events.abort(); };
}
