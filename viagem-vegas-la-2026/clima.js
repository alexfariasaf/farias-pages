/* Previsão do tempo da viagem — Open-Meteo (gratuito, sem chave).
   Cada <div class="clima"> declara: data-lat, data-lon, data-de, data-ate (AAAA-MM-DD),
   data-hmax, data-hmin (média histórica das mesmas datas, °C) e data-chuva (texto). */
(function () {
  var WMO = {
    0: ['☀️', 'Céu limpo'], 1: ['🌤️', 'Quase limpo'], 2: ['⛅', 'Parcialmente nublado'], 3: ['☁️', 'Nublado'],
    45: ['🌫️', 'Nevoeiro'], 48: ['🌫️', 'Nevoeiro'], 51: ['🌦️', 'Garoa fraca'], 53: ['🌦️', 'Garoa'], 55: ['🌦️', 'Garoa forte'],
    61: ['🌧️', 'Chuva fraca'], 63: ['🌧️', 'Chuva'], 65: ['🌧️', 'Chuva forte'], 80: ['🌦️', 'Pancadas fracas'],
    81: ['🌦️', 'Pancadas'], 82: ['⛈️', 'Pancadas fortes'], 95: ['⛈️', 'Trovoada'], 96: ['⛈️', 'Trovoada'], 99: ['⛈️', 'Trovoada']
  };
  var DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  function f(c) { return Math.round(c * 9 / 5 + 32); }
  function r(c) { return Math.round(c); }
  function datas(de, ate) {
    var out = [], d = new Date(de + 'T12:00:00Z'), fim = new Date(ate + 'T12:00:00Z');
    while (d <= fim) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
    return out;
  }
  function rotulo(iso) {
    var d = new Date(iso + 'T12:00:00Z');
    return DOW[d.getUTCDay()] + ' ' + iso.slice(8, 10) + '/' + iso.slice(5, 7);
  }
  function diasAte(iso) {
    var hoje = new Date(); hoje.setHours(12, 0, 0, 0);
    return Math.round((new Date(iso + 'T12:00:00') - hoje) / 864e5);
  }
  function card(iso, dado, hist) {
    var h = '<div class="wx' + (dado ? '' : ' hist') + '"><div class="wd">' + rotulo(iso) + '</div>';
    if (dado) {
      var w = WMO[dado.code] || ['🌡️', ''];
      var conf = diasAte(iso) > 7 ? '<span class="wconf">tendência</span>' : '';
      h += '<div class="wi" title="' + w[1] + '">' + w[0] + '</div>' +
        '<div class="wt"><b>' + r(dado.max) + '°</b> <span>' + r(dado.min) + '°</span></div>' +
        '<div class="wf">' + f(dado.max) + '°F / ' + f(dado.min) + '°F</div>' +
        '<div class="wl">' + w[1] + '</div>' +
        '<div class="wm">💧 ' + (dado.chuva == null ? '–' : dado.chuva + '%') + (dado.uv != null ? ' · UV ' + Math.round(dado.uv) : '') + '</div>' + conf;
    } else {
      var libera = new Date(iso + 'T12:00:00Z'); libera.setUTCDate(libera.getUTCDate() - 15);
      h += '<div class="wi">📊</div><div class="wt"><b>' + r(hist.max) + '°</b> <span>' + r(hist.min) + '°</span></div>' +
        '<div class="wf">' + f(hist.max) + '°F / ' + f(hist.min) + '°F</div>' +
        '<div class="wl">Média histórica</div><div class="wm">previsão a partir de ' +
        libera.toISOString().slice(8, 10) + '/' + libera.toISOString().slice(5, 7) + '</div>';
    }
    return h + '</div>';
  }
  document.querySelectorAll('.clima').forEach(function (el) {
    var ds = datas(el.dataset.de, el.dataset.ate);
    var hist = { max: parseFloat(el.dataset.hmax), min: parseFloat(el.dataset.hmin) };
    var grade = el.querySelector('.wgrid'), status = el.querySelector('.wstatus');
    function pinta(mapa, msg) {
      grade.innerHTML = ds.map(function (d) { return card(d, mapa[d], hist); }).join('');
      status.textContent = msg;
    }
    pinta({}, 'Buscando a previsão…');
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + el.dataset.lat + '&longitude=' + el.dataset.lon +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max' +
      '&timezone=America%2FLos_Angeles&forecast_days=16';
    fetch(url).then(function (x) { if (!x.ok) throw 0; return x.json(); }).then(function (j) {
      var d = j.daily, mapa = {}, n = 0;
      d.time.forEach(function (t, i) {
        if (ds.indexOf(t) > -1 && d.temperature_2m_max[i] != null) {
          mapa[t] = { max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], chuva: d.precipitation_probability_max[i], code: d.weather_code[i], uv: d.uv_index_max[i] };
          n++;
        }
      });
      var agora = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      pinta(mapa, n + ' de ' + ds.length + ' dias com previsão · atualizado em ' + agora + ' · os demais mostram a média histórica');
    }).catch(function () {
      pinta({}, 'Sem conexão com o serviço de previsão agora. Mostrando a média histórica das datas.');
    });
  });
})();
