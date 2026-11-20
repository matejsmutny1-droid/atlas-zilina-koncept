(() => {
  'use strict';
  const form = document.getElementById('inquiry-form');
  const type = document.getElementById('pack-type');
  const custom = document.getElementById('custom-type');
  const code = document.getElementById('inquiry-fefco');
  const clear = document.getElementById('clear-fefco');
  const image = document.getElementById('type-preview-image');
  const title = document.getElementById('preview-title');
  const note = document.getElementById('preview-note');
  const label = document.getElementById('preview-label');
  const quantity = document.getElementById('quantity-mode');
  const exact = document.getElementById('quantity-exact');
  const dialog = document.getElementById('inquiry-catalog');
  const category = document.getElementById('picker-category');
  const search = document.getElementById('picker-search');
  const status = document.getElementById('picker-status');
  const products = document.getElementById('picker-products');
  const groups = {
    '01': {name: 'Prírezy', example: '0100', description: 'Ploché prírezy lepenky na ďalšie spracovanie alebo ochranu produktu.'},
    '02': {name: 'Klopové krabice', example: '0201', description: 'Krabice s uzatváracími klopami. Presné usporiadanie klôp vyberiete v katalógu.'},
    '03': {name: 'Krabice s vekom', example: '0301', description: 'Konštrukcie so samostatným vekom alebo nasúvacími časťami.'},
    '04': {name: 'Skladané obaly a paletky', example: '0427', description: 'Obaly skladané z výseku. V katalógu nájdete rôzne tvary a spôsoby uzatvárania.'},
    '05': {name: 'Zasúvacie obaly', example: '0501', description: 'Obaly s časťami, ktoré sa do seba zasúvajú.'},
    '07': {name: 'Zlepené obaly', example: '0701', description: 'Zlepené konštrukcie pripravené na zostavenie.'},
    '09': {name: 'Vnútorné obalové prvky', example: '0933', description: 'Vložky, priehradky a ďalšie prvky vo vnútri obalu.'}
  };
  let data;
  let loading;
  let lookupVersion = 0;
  const groupId = () => Object.keys(groups).find(id => groups[id].name === type.value);

  function showExample() {
    const group = groups[groupId()];
    custom.required = type.value === 'Iný typ / vlastný opis';
    document.getElementById('custom-type-label').textContent = custom.required
      ? 'Vlastný opis obalu *' : 'Vlastný opis alebo upresnenie obalu / nepovinné';
    clear.hidden = !code.value;
    image.hidden = false;
    image.src = 'inquiry-previews/' + (group?.example || '0201') + '.svg';
    image.alt = 'Ukážka konštrukcie FEFCO ' + (group?.example || '0201');
    label.textContent = group ? 'UKÁŽKA TYPU · FEFCO ' + group.example : 'POMÔCKA PRI VÝBERE';
    title.textContent = group?.name || (custom.required ? 'Máte vlastnú predstavu?' : 'Takto môže vyzerať váš obal.');
    note.textContent = group
      ? group.description + ' Obrázok je príklad; presný kód zatiaľ nie je vybraný.'
      : custom.required ? 'Opíšte tvar obalu alebo priložte vlastný výkres. Obrázok je iba ukážka.'
        : 'Vyberte typ a zobrazíme príklad jeho konštrukcie. Konkrétny tvar vyberiete v katalógu.';
    document.getElementById('fefco-help').textContent = 'Presný kód môžete vybrať v katalógu alebo napísať ručne.';
  }

  function selectConstruction(product) {
    code.value = product.name;
    if (groups[product.category]) type.value = groups[product.category].name;
    showExample();
    image.src = product.detail || product.thumbnail;
    image.alt = 'Technický nákres FEFCO ' + product.name;
    label.textContent = 'VYBRANÁ KONŠTRUKCIA';
    title.textContent = 'FEFCO ' + product.name;
    note.textContent = (groups[product.category]?.name || 'Konštrukcia obalu') + '. Tento kód zahrnieme do vášho dopytu.';
    document.getElementById('fefco-help').textContent = 'Vybrané: FEFCO ' + product.name + '. Kód bude súčasťou zadania.';
    invalidateDraft();
  }

  function loadCatalog() {
    if (data) return Promise.resolve(data);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const finish = () => Promise.resolve(window.ATLAS_CATALOG_READY).then(() => {
        if (!window.ATLAS_CATALOG?.product) throw new Error('Catalogue unavailable');
        data = window.ATLAS_CATALOG;
        resolve(data);
      }).catch(reject);
      if (window.ATLAS_CATALOG_READY) { finish(); return; }
      const script = document.createElement('script');
      script.src = 'catalog-data.js';
      script.onload = finish;
      script.onerror = () => { script.remove(); reject(new Error('Catalogue unavailable')); };
      document.body.append(script);
    }).catch(error => { loading = null; throw error; });
    return loading;
  }

  function renderProducts() {
    if (!data) return;
    const query = search.value.trim().replace(/^FEFCO\s*/i, '');
    const list = data.product.filter(product => query
      ? product.name.includes(query)
      : category.value === 'all' || product.category === category.value);
    products.replaceChildren();
    for (const product of list) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'picker-product';
      button.setAttribute('aria-label', 'Vybrať FEFCO ' + product.name);
      button.setAttribute('aria-pressed', String(code.value === product.name));
      const thumbnail = document.createElement('img');
      thumbnail.src = product.thumbnail;
      thumbnail.alt = 'Konštrukcia FEFCO ' + product.name;
      thumbnail.loading = 'lazy';
      thumbnail.width = 300;
      thumbnail.height = 190;
      const name = document.createElement('strong');
      name.textContent = 'FEFCO ' + product.name;
      const description = document.createElement('span');
      description.textContent = groups[product.category]?.name || '';
      const action = document.createElement('span');
      action.className = 'picker-select';
      action.textContent = code.value === product.name ? 'Vybraný obal' : 'Vybrať tento obal';
      button.append(thumbnail, name, description, action);
      button.addEventListener('click', () => {
        lookupVersion++;
        selectConstruction(product);
        dialog.close();
        code.focus({preventScroll: true});
      });
      products.append(button);
    }
    const noun = list.length === 1 ? 'konštrukcia' : list.length < 5 ? 'konštrukcie' : 'konštrukcií';
    status.textContent = list.length ? list.length + ' ' + noun + (query ? ' · vyhľadávanie vo všetkých typoch' : ' · kliknutím vyberiete obal')
      : 'Takýto kód sme nenašli. Skúste iný alebo opíšte obal vlastnými slovami.';
  }

  type.addEventListener('change', () => {
    lookupVersion++;
    code.value = '';
    showExample();
    invalidateDraft();
  });
  clear.addEventListener('click', () => {
    lookupVersion++;
    code.value = '';
    showExample();
    code.focus();
    invalidateDraft();
  });
  code.addEventListener('input', async () => {
    const version = ++lookupVersion;
    showExample();
    if (!code.value) return;
    image.hidden = true;
    label.textContent = 'VLASTNÝ FEFCO KÓD';
    title.textContent = 'FEFCO ' + code.value;
    note.textContent = 'Zadajte štvormiestny kód konštrukcie.';
    if (!/^\d{4}$/.test(code.value)) return;
    note.textContent = 'Načítavam náhľad konštrukcie…';
    const requested = code.value;
    try {
      await loadCatalog();
      if (version !== lookupVersion || code.value !== requested) return;
      const product = data.product.find(product => product.name === requested);
      if (product) selectConstruction(product);
      else note.textContent = 'Tento kód v našom katalógu nemáme. Do dopytu ho zahrnieme; môžete priložiť vlastný výkres.';
    } catch {
      if (version === lookupVersion) note.textContent = 'Náhľad sa nepodarilo načítať. Zadaný kód zostáva súčasťou dopytu.';
    }
  });

  document.getElementById('choose-fefco').addEventListener('click', async () => {
    category.value = groupId() || 'all';
    search.value = '';
    dialog.showModal();
    status.textContent = 'Načítavam konštrukcie…';
    products.replaceChildren();
    try { await loadCatalog(); renderProducts(); }
    catch { status.textContent = 'Katalóg sa nepodarilo načítať. Skúste ho otvoriť znova alebo napíšte vlastný opis obalu.'; }
  });
  document.getElementById('close-inquiry-catalog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  category.addEventListener('change', () => { search.value = ''; renderProducts(); });
  search.addEventListener('input', renderProducts);
  quantity.addEventListener('change', () => {
    exact.required = quantity.value === 'Presný počet kusov';
    exact.value = '';
    invalidateDraft();
    if (exact.required) exact.focus();
  });
  exact.addEventListener('input', () => {
    if (exact.value !== '') quantity.value = 'Presný počet kusov';
    exact.required = quantity.value === 'Presný počet kusov';
  });
  form.addEventListener('change', invalidateDraft);
  showExample();
  const initialCode = new URLSearchParams(location.search).get('fefco');
  if (initialCode && /^\d{4}$/.test(initialCode)) {
    code.value = initialCode;
    code.dispatchEvent(new Event('input', {bubbles: true}));
  }
})();
