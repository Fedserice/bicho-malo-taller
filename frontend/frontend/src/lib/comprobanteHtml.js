import logoTaller from "../assets/logo1-transparente.png";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function texto(valor, alternativo = "—") {
  return (valor ?? "").toString().trim() || alternativo;
}

function escaparHtml(valor) {
  return texto(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fechaLegible(valor) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor ?? "");
  if (!partes) return "No registrada";

  return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])).toLocaleDateString(
    "es-AR",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );
}

function referenciaVisita(id) {
  return (id ?? "").replace(/-/g, "").slice(-8).toUpperCase() || "S/N";
}

function nombreArchivo(valor) {
  return texto(valor, "vehiculo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function descargarComprobanteEntrega({ visita, vehiculo }) {
  const ventana = window.open("", "_blank");
  if (!ventana) {
    throw new Error("El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes para este sitio.");
  }

  try {
    const respuesta = await fetch("/constancia-entrega.html");
    if (!respuesta.ok) throw new Error("No se pudo cargar la plantilla de la constancia.");

    let html = await respuesta.text();
    const manoObra = Number(visita.manoObra) || 0;
    const cobrado = Number(visita.totalCobrado) || 0;
    const saldo = Math.max(manoObra - cobrado, 0);
    const referencia = referenciaVisita(visita.id);
    const valores = {
      LOGO_URL: escaparHtml(logoTaller),
      REFERENCIA: escaparHtml(referencia),
      CLIENTE: escaparHtml(vehiculo.cliente),
      TELEFONO: escaparHtml(vehiculo.telefono),
      PATENTE: escaparHtml(vehiculo.patente),
      VEHICULO: escaparHtml(vehiculo.vehiculo),
      KILOMETRAJE: escaparHtml(visita.kilometraje ? `${visita.kilometraje} km` : "—"),
      MECANICO: escaparHtml(visita.mecanico),
      FECHA_INGRESO: escaparHtml(fechaLegible(visita.fecha)),
      FECHA_ENTREGA: escaparHtml(fechaLegible(visita.fechaEntrega)),
      MOTIVO: escaparHtml(visita.motivo),
      DIAGNOSTICO: escaparHtml(visita.diagnostico),
      TRABAJOS: escaparHtml(visita.trabajos),
      MANO_OBRA: escaparHtml(pesos.format(manoObra)),
      COBRADO: escaparHtml(pesos.format(cobrado)),
      CLASE_SALDO: saldo > 0 ? "finanza--saldo" : "finanza--saldo-cero",
      ETIQUETA_SALDO: saldo > 0 ? "Saldo pendiente" : "Saldo",
      SALDO: escaparHtml(saldo > 0 ? pesos.format(saldo) : "Cancelado"),
      BLOQUE_OBSERVACIONES: visita.observaciones?.trim()
        ? `<div class="servicio"><strong class="servicio__etiqueta">Observaciones</strong><p class="servicio__valor">${escaparHtml(visita.observaciones)}</p></div>`
        : "",
    };

    Object.entries(valores).forEach(([clave, valor]) => {
      html = html.replaceAll(`{{${clave}}}`, valor);
    });

    const patente = nombreArchivo(vehiculo.patente);
    const fecha = visita.fechaEntrega || visita.fecha || "entrega";
    ventana.document.title = `constancia-entrega-${patente}-${fecha}`;
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  } catch (error) {
    ventana.close();
    throw error;
  }
}