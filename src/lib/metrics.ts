import type { FrameMetrics, MatchMetadata, PlayerMetric, TeamShape, TrackingFrame } from "../types";

const FRAME_RATE = 10;

export function computeFrameMetrics(
  frame: TrackingFrame | undefined,
  previousFrame: TrackingFrame | undefined,
  metadata: MatchMetadata | null,
): FrameMetrics {
  if (!frame || !metadata) {
    return { players: [] };
  }

  const playersById = new Map(metadata.players.map((player) => [player.id, player]));
  const previousById = new Map(previousFrame?.player_data.map((player) => [player.player_id, player]) ?? []);
  const ball = frame.ball_data.x !== null && frame.ball_data.y !== null ? frame.ball_data : undefined;

  const players: PlayerMetric[] = frame.player_data.map((player) => {
    const previous = previousById.get(player.player_id);
    const matchPlayer = playersById.get(player.player_id);
    return {
      ...player,
      player: matchPlayer,
      team:
        matchPlayer?.team_id === metadata.home_team.id
          ? metadata.home_team
          : matchPlayer?.team_id === metadata.away_team.id
            ? metadata.away_team
            : undefined,
      distanceToBall: ball ? distance(player.x, player.y, ball.x ?? 0, ball.y ?? 0) : undefined,
      speed: previous ? distance(player.x, player.y, previous.x, previous.y) * FRAME_RATE : undefined,
    };
  });

  const closestToBall = players
    .filter((player) => player.distanceToBall !== undefined)
    .reduce<PlayerMetric | undefined>(
      (selected, player) =>
        !selected || (player.distanceToBall ?? Infinity) < (selected.distanceToBall ?? Infinity) ? player : selected,
      undefined,
    );
  const fastest = players
    .filter((player) => player.speed !== undefined)
    .reduce<PlayerMetric | undefined>(
      (selected, player) => (!selected || (player.speed ?? -Infinity) > (selected.speed ?? -Infinity) ? player : selected),
      undefined,
    );

  return {
    closestToBall,
    fastest,
    ballSpeed: estimateBallSpeed(frame, previousFrame),
    homeShape: computeTeamShape(players.filter((player) => player.player?.team_id === metadata.home_team.id)),
    awayShape: computeTeamShape(players.filter((player) => player.player?.team_id === metadata.away_team.id)),
    players: players.sort((a, b) => (a.distanceToBall ?? Number.MAX_VALUE) - (b.distanceToBall ?? Number.MAX_VALUE)),
  };
}

function estimateBallSpeed(frame: TrackingFrame, previousFrame: TrackingFrame | undefined): number | undefined {
  const ball = frame.ball_data;
  const previousBall = previousFrame?.ball_data;
  if (
    ball.x === null ||
    ball.y === null ||
    previousBall?.x === null ||
    previousBall?.y === null ||
    previousBall?.x === undefined ||
    previousBall?.y === undefined
  ) {
    return undefined;
  }

  return distance(ball.x, ball.y, previousBall.x, previousBall.y) * FRAME_RATE;
}

function computeTeamShape(players: PlayerMetric[]): TeamShape | undefined {
  if (players.length === 0) {
    return undefined;
  }

  const xs = players.map((player) => player.x);
  const ys = players.map((player) => player.y);
  return {
    width: Math.max(...ys) - Math.min(...ys),
    depth: Math.max(...xs) - Math.min(...xs),
    centroidX: average(xs),
    centroidY: average(ys),
  };
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatMeters(value: number | undefined): string {
  return value === undefined ? "N/A" : `${value.toFixed(1)} m`;
}

export function formatSpeed(value: number | undefined): string {
  return value === undefined ? "N/A" : `${value.toFixed(1)} m/s`;
}
