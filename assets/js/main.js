const API_URL = 'https://mindicador.cl/api';
const LOCAL_SERIES = 'https://geraldine-margarita.github.io/Prueba-Api/mindicador.json'; 

const $ = s => document.querySelector(s);
const montoInput = $('#monto');
const monedaSelect = $('#moneda');
const resultadoP = $('#resultado');
const errorP = $('#error');
const sourceP = $('#source');

let currentChart = null;
const ctx = document.getElementById('historialChart').getContext('2d');

async function fetchValoresActuales() {
try {
const r = await fetch(API_URL);
if(!r.ok) throw new Error('API no disponible');
const data = await r.json();
console.log("Valores desde API");
return { data, source:"API" };
} catch (e) {
console.warn("API falló, usando fallback mínimo.");
return {
data:{
dolar:{ nombre:"Dólar observado", valor:900 },
euro:{ nombre:"Euro", valor:920 }
},
source:"FALLBACK"
};
}
}


async function fetchHistorial() {
try {
const r = await fetch(LOCAL_SERIES);
if(!r.ok) throw new Error("No se encontró mindicador.json");
const data = await r.json();
console.log("Historial desde JSON local");
return data;
} catch(e) {
console.error("Error historial:", e.message);
return null;
}
}

function formatNumber(n) {
return Number(n).toLocaleString("en-GB", {
minimumFractionDigits:2,
maximumFractionDigits:2
});
}

function dibujarGrafico(labels, values, nombre) {
if(currentChart) currentChart.destroy();
currentChart = new Chart(ctx, {
type:"line",
data:{
labels,
datasets:[
{
label:nombre,
data:values,
borderWidth:2,
tension:0.2
}
]
},
options:{ responsive:true, maintainAspectRatio:false }
});
}

function prepararSerie(ind) {
if(!ind.serie) return { labels:[], values:[] };
const serie = ind.serie.slice(0,10).reverse();
return {
labels: serie.map(s => s.fecha.split("T")[0]),
values: serie.map(s => s.valor)
};
}

document.getElementById("buscar").addEventListener("click", async ()=>{
const monto = Number(montoInput.value);
const moneda = monedaSelect.value;

if(!monto || monto <=0) return errorP.textContent="Ingresa un monto válido";
if(!moneda) return errorP.textContent="Selecciona moneda";

errorP.textContent = "";
resultadoP.textContent = "Cargando...";


const { data:valoresActuales, source } = await fetchValoresActuales();
sourceP.textContent = `Fuente valor actual: ${source}`;

const valorActual = valoresActuales[moneda];
const resultado = monto / valorActual.valor;
resultadoP.textContent = `Resultado: $${formatNumber(resultado)} (${valorActual.nombre})`;

const historial = await fetchHistorial();

if(!historial || !historial[moneda] || !historial[moneda].serie) {
resultadoP.textContent += " (Sin historial para graficar)";
return;
}

const { labels, values } = prepararSerie(historial[moneda]);
dibujarGrafico(labels, values, valorActual.nombre);
});

