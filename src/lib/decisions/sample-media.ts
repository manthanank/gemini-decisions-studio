/**
 * Generates deterministic sample PNG images in the browser using Canvas
 * so multimodal image inspection templates work immediately offline or live.
 */
export function generateSamplePngBase64(
  kind: "cracked_parcel" | "clean_parcel" | "invoice_badge",
): { base64: string; previewUrl: string; filename: string } {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { base64: "", previewUrl: "", filename: `${kind}.png` };
  }

  // Background porch / desk gradient
  const grad = ctx.createLinearGradient(0, 0, 640, 420);
  if (kind === "invoice_badge") {
    grad.addColorStop(0, "#f8fafc");
    grad.addColorStop(1, "#e2e8f0");
  } else if (kind === "clean_parcel") {
    grad.addColorStop(0, "#d6d3d1");
    grad.addColorStop(1, "#a8a29e");
  } else {
    grad.addColorStop(0, "#cbd5e1");
    grad.addColorStop(1, "#94a3b8");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 420);

  if (kind === "invoice_badge") {
    // Draw clean invoice sheet
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.fillRect(80, 35, 480, 350);
    ctx.strokeRect(80, 35, 480, 350);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("NIMBUS CLOUD SYSTEMS", 110, 82);
    ctx.fillStyle = "#475569";
    ctx.font = "15px monospace";
    ctx.fillText("INVOICE #INV-90412", 110, 114);
    ctx.fillStyle = "#047857";
    ctx.font = "bold 16px monospace";
    ctx.fillText("PO NUMBER: PO-2026-4410", 110, 144);

    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(110, 168);
    ctx.lineTo(530, 168);
    ctx.stroke();

    ctx.fillStyle = "#1e293b";
    ctx.font = "15px sans-serif";
    ctx.fillText("4x H200 GPU Compute Nodes (120 hrs)", 110, 206);
    ctx.fillText("$1,840.00", 450, 206);
    ctx.fillText("Managed High-Speed NVMe Storage", 110, 238);
    ctx.fillText("$160.00", 468, 238);

    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(110, 275);
    ctx.lineTo(530, 275);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("TOTAL DUE (NET 30): $2,000.00", 110, 318);

    const dataUrl = canvas.toDataURL("image/png");
    return {
      base64: dataUrl.split(",")[1] ?? "",
      previewUrl: dataUrl,
      filename: "sample-cloud-invoice.png",
    };
  }

  // Porch floor planks
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 2;
  for (let y = 260; y <= 420; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }

  // Cardboard parcel box
  ctx.fillStyle = "#c28e5c";
  ctx.strokeStyle = "#78502b";
  ctx.lineWidth = 3;
  ctx.fillRect(180, 125, 280, 200);
  ctx.strokeRect(180, 125, 280, 200);

  // Top flap shading
  ctx.fillStyle = "#d9a977";
  ctx.beginPath();
  ctx.moveTo(180, 125);
  ctx.lineTo(220, 88);
  ctx.lineTo(500, 88);
  ctx.lineTo(460, 125);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shipping label
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(210, 155, 115, 72);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 12px monospace";
  ctx.fillText("PRIORITY PARCEL", 218, 176);
  ctx.fillRect(218, 186, 95, 16);
  ctx.font = "10px monospace";
  ctx.fillText("TRK #8841-9920", 218, 216);

  if (kind === "cracked_parcel") {
    // Crushed corner + jagged tear + water stain
    ctx.fillStyle = "rgba(30, 41, 59, 0.35)";
    ctx.beginPath();
    ctx.moveTo(395, 125);
    ctx.lineTo(460, 125);
    ctx.lineTo(460, 215);
    ctx.lineTo(415, 195);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(395, 125);
    ctx.lineTo(420, 160);
    ctx.lineTo(400, 185);
    ctx.lineTo(448, 225);
    ctx.stroke();

    // Water stain puddle
    ctx.fillStyle = "rgba(30, 58, 138, 0.25)";
    ctx.beginPath();
    ctx.ellipse(390, 315, 75, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#991b1b";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("CRUSHED CORNER & WET SEAL", 195, 368);
  } else {
    // Clean intact tape seal
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(310, 88, 24, 237);
    ctx.fillStyle = "#166534";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("SHELTERED PORCH • INTACT SEAL", 195, 368);
  }

  const dataUrl = canvas.toDataURL("image/png");
  return {
    base64: dataUrl.split(",")[1] ?? "",
    previewUrl: dataUrl,
    filename: kind === "cracked_parcel" ? "damaged-parcel.png" : "clean-porch-parcel.png",
  };
}
