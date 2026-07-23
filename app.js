// Categorías por defecto
const CATEGORIAS = {
  ingreso: ['Sueldo / Nómina', 'Freelance / Proyectos', 'Inversiones', 'Ventas', 'Otros Ingresos'],
  gasto: ['Servicios / Hogar', 'Alimentación', 'Transporte', 'Educación', 'Entretenimiento', 'Salud', 'Otros Gastos']
};

let usuarioActual = localStorage.getItem('usuario_activo') || '';
let transacciones = [];
let graficoCategorias, graficoBarras;

// Elementos DOM Login
const pantallaLogin = document.getElementById('pantalla-login');
const dashboard = document.getElementById('dashboard');
const formLogin = document.getElementById('form-login');
const nombreUsuarioInput = document.getElementById('nombre-usuario-input');
const saludoUsuarioEl = document.getElementById('saludo-usuario');
const nombreUsuarioBadge = document.getElementById('nombre-usuario-badge');
const btnCambiarUsuario = document.getElementById('btn-cambiar-usuario');

// Elementos DOM Dashboard
const form = document.getElementById('form-transaccion');
const descripcionInput = document.getElementById('descripcion');
const montoInput = document.getElementById('monto');
const tipoSelect = document.getElementById('tipo');
const categoriaSelect = document.getElementById('categoria');
const fechaInput = document.getElementById('fecha');
const filtroFechaInput = document.getElementById('filtro-fecha');
const buscadorInput = document.getElementById('buscador');

const totalIngresosEl = document.getElementById('total-ingresos');
const totalGastosEl = document.getElementById('total-gastos');
const balanceTotalEl = document.getElementById('balance-total');
const tasaAhorroEl = document.getElementById('tasa-ahorro');
const listaTransaccionesEl = document.getElementById('lista-transacciones');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  const hoy = new Date().toISOString().split('T')[0];
  fechaInput.value = hoy;
  filtroFechaInput.value = hoy.substring(0, 7);

  actualizarOpcionesCategoria();
  
  if (usuarioActual) {
    iniciarSesion(usuarioActual);
  } else {
    pantallaLogin.classList.remove('hidden');
  }

  lucide.createIcons();
});

// LOGIN / SESIÓN
formLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = nombreUsuarioInput.value.trim().toLowerCase();
  if (nombre) {
    iniciarSesion(nombre);
  }
});

btnCambiarUsuario.addEventListener('click', () => {
  localStorage.removeItem('usuario_activo');
  usuarioActual = '';
  dashboard.classList.add('hidden');
  pantallaLogin.classList.remove('hidden');
  nombreUsuarioInput.value = '';
});

function iniciarSesion(nombre) {
  usuarioActual = nombre.toLowerCase();
  localStorage.setItem('usuario_activo', usuarioActual);

  // Nombre formateado (primera letra mayúscula)
  const nombreFormateado = usuarioActual.charAt(0).toUpperCase() + usuarioActual.slice(1);
  saludoUsuarioEl.textContent = `¡Hola de nuevo, ${nombreFormateado}! 👋`;
  nombreUsuarioBadge.textContent = nombreFormateado;

  pantallaLogin.classList.add('hidden');
  dashboard.classList.remove('hidden');

  // Cargar transacciones de ESTE usuario
  transacciones = JSON.parse(localStorage.getItem(`transacciones_${usuarioActual}`)) || [];

  if (!graficoCategorias) inicializarGraficos();
  actualizarUI();
}

// Event Listeners
tipoSelect.addEventListener('change', actualizarOpcionesCategoria);
filtroFechaInput.addEventListener('change', actualizarUI);
buscadorInput.addEventListener('input', actualizarUI);

function actualizarOpcionesCategoria() {
  const tipo = tipoSelect.value;
  categoriaSelect.innerHTML = '';
  CATEGORIAS[tipo].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoriaSelect.appendChild(opt);
  });
}

// Agregar movimiento
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nuevaTransaccion = {
    id: Date.now(),
    descripcion: descripcionInput.value.trim(),
    monto: parseFloat(montoInput.value),
    tipo: tipoSelect.value,
    categoria: categoriaSelect.value,
    fecha: fechaInput.value
  };

  transacciones.unshift(nuevaTransaccion);
  guardarEnLocalStorage();
  actualizarUI();

  descripcionInput.value = '';
  montoInput.value = '';
});

function eliminarTransaccion(id) {
  transacciones = transacciones.filter(t => t.id !== id);
  guardarEnLocalStorage();
  actualizarUI();
}

function guardarEnLocalStorage() {
  // Guarda bajo una clave única por usuario: transacciones_luis, transacciones_esposa, etc.
  localStorage.setItem(`transacciones_${usuarioActual}`, JSON.stringify(transacciones));
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor);
}

function obtenerTransaccionesFiltradas() {
  const mesSeleccionado = filtroFechaInput.value;
  const textoBuscador = buscadorInput.value.toLowerCase();

  return transacciones.filter(t => {
    const coincideMes = mesSeleccionado ? t.fecha.startsWith(mesSeleccionado) : true;
    const coincideTexto = t.descripcion.toLowerCase().includes(textoBuscador) ||
                          t.categoria.toLowerCase().includes(textoBuscador);
    return coincideMes && coincideTexto;
  });
}

function actualizarUI() {
  const filtradas = obtenerTransaccionesFiltradas();

  const ingresos = filtradas.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + t.monto, 0);
  const gastos = filtradas.filter(t => t.tipo === 'gasto').reduce((acc, t) => acc + t.monto, 0);
  const balance = ingresos - gastos;
  const tasaAhorro = ingresos > 0 ? Math.max(0, ((ingresos - gastos) / ingresos) * 100).toFixed(1) : 0;

  totalIngresosEl.textContent = formatearMoneda(ingresos);
  totalGastosEl.textContent = formatearMoneda(gastos);
  balanceTotalEl.textContent = formatearMoneda(balance);
  tasaAhorroEl.textContent = `${tasaAhorro}%`;

  balanceTotalEl.className = balance < 0 ? 'text-2xl font-black text-rose-500 mt-2' : 'text-2xl font-black text-cyan-300 mt-2';

  // Tabla
  listaTransaccionesEl.innerHTML = '';
  if (filtradas.length === 0) {
    listaTransaccionesEl.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-slate-500 text-sm">
          No hay movimientos para este periodo o usuario.
        </td>
      </tr>`;
  } else {
    filtradas.forEach(t => {
      const esIngreso = t.tipo === 'ingreso';
      const row = document.createElement('tr');
      row.className = 'hover:bg-slate-800/40 transition-colors border-b border-slate-800/30';
      row.innerHTML = `
        <td class="py-3.5 px-3 text-slate-400 font-mono text-xs">${t.fecha}</td>
        <td class="py-3.5 px-3 font-semibold text-slate-200">${t.descripcion}</td>
        <td class="py-3.5 px-3">
          <span class="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            ${t.categoria}
          </span>
        </td>
        <td class="py-3.5 px-3 text-right font-bold ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}">
          ${esIngreso ? '+' : '-'}${formatearMoneda(t.monto)}
        </td>
        <td class="py-3.5 px-3 text-center">
          <button onclick="eliminarTransaccion(${t.id})" class="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-all">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      `;
      listaTransaccionesEl.appendChild(row);
    });
  }

  lucide.createIcons();
  actualizarGraficos(filtradas, ingresos, gastos);
}

function inicializarGraficos() {
  const ctxCat = document.getElementById('graficoCategorias').getContext('2d');
  graficoCategorias = new Chart(ctxCat, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ['#f43f5e', '#a855f7', '#06b6d4', '#eab308', '#3b82f6', '#10b981', '#64748b'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
      },
      cutout: '70%'
    }
  });

  const ctxBar = document.getElementById('graficoBarras').getContext('2d');
  graficoBarras = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: ['Ingresos', 'Gastos'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

function actualizarGraficos(filtradas, ingresos, gastos) {
  const gastosPorCat = {};
  filtradas.filter(t => t.tipo === 'gasto').forEach(t => {
    gastosPorCat[t.categoria] = (gastosPorCat[t.categoria] || 0) + t.monto;
  });

  if (graficoCategorias) {
    graficoCategorias.data.labels = Object.keys(gastosPorCat);
    graficoCategorias.data.datasets[0].data = Object.values(gastosPorCat);
    graficoCategorias.update();
  }

  if (graficoBarras) {
    graficoBarras.data.datasets[0].data = [ingresos, gastos];
    graficoBarras.update();
  }
}

// Exportar a Excel
document.getElementById('btn-exportar').addEventListener('click', () => {
  const filtradas = obtenerTransaccionesFiltradas();
  if (filtradas.length === 0) return alert('No hay datos para exportar.');

  const datosExcel = filtradas.map(t => ({
    Usuario: usuarioActual,
    Fecha: t.fecha,
    Concepto: t.descripcion,
    Tipo: t.tipo.toUpperCase(),
    Categoría: t.categoria,
    Monto: t.monto
  }));

  const hoja = XLSX.utils.json_to_sheet(datosExcel);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Transacciones");
  XLSX.writeFile(libro, `Finanzas_${usuarioActual}_${filtroFechaInput.value || 'General'}.xlsx`);
});