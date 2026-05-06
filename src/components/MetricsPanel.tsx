import type { FrameMetrics, MatchMetadata } from "../types";
import { formatMeters, formatSpeed } from "../lib/metrics";

type MetricsPanelProps = {
  metadata: MatchMetadata | null;
  metrics: FrameMetrics;
};

export function MetricsPanel({ metadata, metrics }: MetricsPanelProps) {
  return (
    <section className="panel metricsPanel">
      <div className="panelHeader">
        <h2>Frame Metrics</h2>
      </div>
      <div className="metricGrid">
        <Metric label="Closest to ball" value={playerLabel(metrics.closestToBall)} detail={formatMeters(metrics.closestToBall?.distanceToBall)} />
        <Metric label="Fastest player" value={playerLabel(metrics.fastest)} detail={formatSpeed(metrics.fastest?.speed)} />
        <Metric label="Ball speed" value={formatSpeed(metrics.ballSpeed)} detail="estimated from previous frame" />
        <Metric label="Possession" value="N/A" detail="from frame metadata when present" />
      </div>

      <div className="shapeGrid">
        <Shape title={metadata?.home_team.acronym ?? "Home"} width={metrics.homeShape?.width} depth={metrics.homeShape?.depth} />
        <Shape title={metadata?.away_team.acronym ?? "Away"} width={metrics.awayShape?.width} depth={metrics.awayShape?.depth} />
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>Ball distance</th>
              <th>Speed</th>
            </tr>
          </thead>
          <tbody>
            {metrics.players.slice(0, 8).map((player) => (
              <tr key={player.player_id}>
                <td>{playerLabel(player)}</td>
                <td>{player.team?.acronym ?? "-"}</td>
                <td>{formatMeters(player.distanceToBall)}</td>
                <td>{formatSpeed(player.speed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metricCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Shape({ title, width, depth }: { title: string; width?: number; depth?: number }) {
  return (
    <article className="shapeCard">
      <strong>{title}</strong>
      <span>Width {formatMeters(width)}</span>
      <span>Depth {formatMeters(depth)}</span>
    </article>
  );
}

function playerLabel(player: { player?: { short_name: string; number: number } } | undefined): string {
  return player?.player ? `#${player.player.number} ${player.player.short_name}` : "N/A";
}
