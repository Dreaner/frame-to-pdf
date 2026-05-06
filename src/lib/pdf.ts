import { jsPDF } from "jspdf";
import type { FrameMetrics, MatchMetadata, TrackingFrame } from "../types";
import { formatMeters, formatSpeed } from "./metrics";

export function exportFramePdf(
  canvas: HTMLCanvasElement | null,
  metadata: MatchMetadata,
  frame: TrackingFrame,
  metrics: FrameMetrics,
): void {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(244, 247, 242);
  pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");
  pdf.setTextColor(22, 31, 36);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Match Frame Snapshot", 14, 16);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`${metadata.home_team.name} ${metadata.home_team_score}-${metadata.away_team_score} ${metadata.away_team.name}`, 14, 25);
  pdf.text(`Frame ${frame.frame} | ${frame.timestamp ?? "No timestamp"} | Period ${frame.period ?? "N/A"}`, 14, 31);

  if (canvas) {
    const image = canvas.toDataURL("image/png", 1);
    pdf.addImage(image, "PNG", 14, 39, 170, 110);
  }

  const x = 196;
  let y = 45;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Key Metrics", x, y);
  y += 10;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const rows = [
    ["Closest to ball", playerLabel(metrics.closestToBall), formatMeters(metrics.closestToBall?.distanceToBall)],
    ["Fastest player", playerLabel(metrics.fastest), formatSpeed(metrics.fastest?.speed)],
    ["Ball speed", "", formatSpeed(metrics.ballSpeed)],
    [`${metadata.home_team.acronym ?? "Home"} width`, "", formatMeters(metrics.homeShape?.width)],
    [`${metadata.away_team.acronym ?? "Away"} width`, "", formatMeters(metrics.awayShape?.width)],
    [`${metadata.home_team.acronym ?? "Home"} depth`, "", formatMeters(metrics.homeShape?.depth)],
    [`${metadata.away_team.acronym ?? "Away"} depth`, "", formatMeters(metrics.awayShape?.depth)],
  ];

  rows.forEach(([label, name, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(label, x, y);
    pdf.setFont("helvetica", "normal");
    pdf.text([name, value].filter(Boolean).join(" | "), x, y + 5);
    y += 16;
  });

  pdf.save(`frame-${frame.frame}-report.pdf`);
}

function playerLabel(player: { player?: { short_name: string; number: number } } | undefined): string {
  return player?.player ? `#${player.player.number} ${player.player.short_name}` : "N/A";
}
