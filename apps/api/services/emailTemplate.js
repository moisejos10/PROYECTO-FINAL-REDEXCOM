/**
 * emailTemplate.js — Sistema de plantillas de correo corporativo
 * Corporación RedexCom · Diseño minimalista y profesional
 * 
 * El logo se lee del filesystem y se embebe como data URI base64
 * directamente en el HTML — no se envía como adjunto separado.
 */
// ─── Wrapper principal ───
export function email(body, accent = '#E31E24') {
  return `
<div style="margin:0;padding:0;background-color:#cbd5e1;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 15px 35px rgba(0,0,0,0.15);border:1px solid #94a3b8">

        <!-- ▸ HEADER MINIMALISTA: LOGO CENTRADO Y MÁS GRANDE -->
        <tr>
          <td style="padding:40px 40px 10px;text-align:center;border-bottom:3px solid ${accent}">
            <img src="cid:logo_redexcom" alt="Corporación RedexCom" style="height:140px;width:auto;display:block;margin:0 auto"/>
          </td>
        </tr>

        <!-- ▸ BODY -->
        <tr>
          <td style="padding:36px 40px 40px;color:#334155;font-size:16px;line-height:1.7">
            ${body}
          </td>
        </tr>

      </table>

      <!-- ▸ FOOTER -->
      <table width="600" cellpadding="0" cellspacing="0" style="padding:28px 40px 0;text-align:center">
        <tr>
          <td style="padding-top:24px">
            <img src="cid:logo_redexcom" alt="RedexCom" style="height:140px;width:auto;display:block;margin:0 auto 16px;opacity:0.85;filter:grayscale(100%)"/>
            <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;font-weight:600">
              Corporación RedexCom © ${new Date().getFullYear()} · Todos los derechos reservados
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b">
              +58 412-5550101 · soporte@redexcom.com
            </p>
            <p style="margin:16px auto 0;font-size:10px;color:#94a3b8;line-height:1.5;max-width:500px">
              Este correo fue generado automáticamente. La información contenida es confidencial y está destinada
              únicamente al destinatario. Si usted no es el destinatario, por favor notifíquenos y elimine este mensaje.
            </p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</div>`;
}

// ─── Botón de acción ───
export function btn(text, href, color = '#E31E24') {
  return `
<div style="text-align:center;margin:28px 0 4px">
  <a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:.3px">${text}</a>
</div>`;
}

// ─── Badge de estado ───
export function badge(text, bg, fg) {
  return `<span style="display:inline-block;background:${bg};color:${fg};padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase">${text}</span>`;
}

// ─── Tabla de datos (estilo ficha técnica) ───
export function ficha(rows) {
  const r = rows.map(([label, value, extra = '']) => `
    <tr>
      <td style="padding:11px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;font-size:13px;width:30%;vertical-align:top">${label}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;${extra}">${value}</td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:20px 0;border-collapse:collapse">${r}</table>`;
}

// ─── Caja de código (verificación) ───
export function codeBox(code) {
  return `
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #E31E24;border-radius:8px;padding:28px 20px;text-align:center;margin:24px 0">
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:2.5px;color:#94a3b8;font-weight:700;margin-bottom:12px">Código de verificación</div>
  <div style="font-size:40px;letter-spacing:10px;font-family:'Courier New',monospace;font-weight:800;color:#0f172a;padding-left:10px">${code}</div>
  <div style="font-size:12px;color:#E31E24;font-weight:600;margin-top:12px">Expira en 1 hora</div>
</div>`;
}
