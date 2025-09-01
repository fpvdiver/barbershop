// admin/js/masks.js
(function () {
  const onlyDigits = (v) => v.replace(/\D+/g, '');

  function maskPhone(v) {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) {
      // (11) 1234-5678
      return d
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    // (11) 91234-5678
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function maskCPF(v) {
    const d = onlyDigits(v).slice(0, 11);
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  function maskCEP(v) {
    const d = onlyDigits(v).slice(0, 8);
    return d.replace(/^(\d{5})(\d)/, '$1-$2');
  }

  function bindMask(input, masker) {
    if (!input) return;
    const handler = () => {
      const start = input.selectionStart;
      const oldLen = input.value.length;
      input.value = masker(input.value);
      // tenta manter o cursor estável em casos simples
      const newLen = input.value.length;
      const diff = newLen - oldLen;
      input.setSelectionRange(Math.max(0, start + diff), Math.max(0, start + diff));
    };
    input.addEventListener('input', handler);
    input.addEventListener('blur', handler);
    // 1a aplicação
    handler();
  }

  // API pública
  window.InputMasks = {
    applyDefault: () => {
      bindMask(document.getElementById('fTelefone'), maskPhone);
      bindMask(document.getElementById('fCpf'), maskCPF);
      // Se criar um campo CEP com id="fCep", descomente:
      // bindMask(document.getElementById('fCep'), maskCEP);
    },
    maskPhone,
    maskCPF,
    maskCEP,
    bindMask
  };
})();
