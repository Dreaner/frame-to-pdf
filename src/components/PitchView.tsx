import { useEffect } from "react";
import type { RefObject } from "react";
import type { FrameMetrics, MatchMetadata, TrackingFrame } from "../types";

type PitchViewProps = {
  metadata: MatchMetadata | null;
  frame: TrackingFrame | undefined;
  metrics: FrameMetrics;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export function PitchView({ metadata, frame, metrics, canvasRef }: PitchViewProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawPitch(context, rect.width, rect.height, metadata, frame, metrics);
  }, [metadata, frame, metrics]);

  return <canvas ref={canvasRef} className="pitchCanvas" aria-label="Selected frame pitch view" />;
}

function drawPitch(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  metadata: MatchMetadata | null,
  frame: TrackingFrame | undefined,
  metrics: FrameMetrics,
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#3f7444";
  context.fillRect(0, 0, width, height);

  const pitchLength = metadata?.pitch_length ?? 105;
  const pitchWidth = metadata?.pitch_width ?? 68;
  const margin = 28;
  const pitchRatio = pitchLength / pitchWidth;
  const innerWidth = width - margin * 2;
  const innerHeight = height - margin * 2;
  const drawWidth = Math.min(innerWidth, innerHeight * pitchRatio);
  const drawHeight = drawWidth / pitchRatio;
  const left = (width - drawWidth) / 2;
  const top = (height - drawHeight) / 2;

  const project = (x: number, y: number) => ({
    x: left + ((x + pitchLength / 2) / pitchLength) * drawWidth,
    y: top + ((pitchWidth / 2 - y) / pitchWidth) * drawHeight,
  });

  context.strokeStyle = "rgba(255,255,255,0.82)";
  context.lineWidth = 1.4;
  context.strokeRect(left, top, drawWidth, drawHeight);
  line(context, left + drawWidth / 2, top, left + drawWidth / 2, top + drawHeight);
  circle(context, left + drawWidth / 2, top + drawHeight / 2, (9.15 / pitchLength) * drawWidth);
  circle(context, left + drawWidth / 2, top + drawHeight / 2, 2);

  drawBox(context, project, -pitchLength / 2, 0, 16.5, 40.3);
  drawBox(context, project, pitchLength / 2, 0, -16.5, 40.3);
  drawBox(context, project, -pitchLength / 2, 0, 5.5, 18.3);
  drawBox(context, project, pitchLength / 2, 0, -5.5, 18.3);

  if (!metadata || !frame || frame.player_data.length === 0) {
    context.fillStyle = "rgba(255,255,255,0.8)";
    context.font = "600 18px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("Upload files and choose a populated frame", width / 2, height / 2);
    return;
  }

  const playerById = new Map(metadata.players.map((player) => [player.id, player]));
  const colors = {
    home: metadata.home_team_kit?.jersey_color ?? "#173f8f",
    away: metadata.away_team_kit?.jersey_color ?? "#e64f8f",
  };

  for (const playerData of frame.player_data) {
    const player = playerById.get(playerData.player_id);
    const isHome = player?.team_id === metadata.home_team.id;
    const point = project(playerData.x, playerData.y);
    const isClosest = metrics.closestToBall?.player_id === playerData.player_id;
    const isFastest = metrics.fastest?.player_id === playerData.player_id;

    context.beginPath();
    context.fillStyle = isHome ? colors.home : colors.away;
    context.strokeStyle = isClosest ? "#f8df72" : isFastest ? "#79d5ff" : "rgba(255,255,255,0.85)";
    context.lineWidth = isClosest || isFastest ? 3 : 1.4;
    context.arc(point.x, point.y, 8, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = isHome ? metadata.home_team_kit?.number_color ?? "#fff" : metadata.away_team_kit?.number_color ?? "#fff";
    context.font = "700 8px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(player?.number ?? ""), point.x, point.y + 0.5);
  }

  if (frame.ball_data.x !== null && frame.ball_data.y !== null) {
    const ball = project(frame.ball_data.x, frame.ball_data.y);
    context.beginPath();
    context.fillStyle = "#f7f2df";
    context.strokeStyle = "#161f24";
    context.lineWidth = 1.5;
    context.arc(ball.x, ball.y, 5.2, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
}

function line(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function circle(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.stroke();
}

function drawBox(
  context: CanvasRenderingContext2D,
  project: (x: number, y: number) => { x: number; y: number },
  goalLineX: number,
  centerY: number,
  depth: number,
  boxWidth: number,
) {
  const a = project(goalLineX, centerY + boxWidth / 2);
  const b = project(goalLineX + depth, centerY - boxWidth / 2);
  context.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
}
