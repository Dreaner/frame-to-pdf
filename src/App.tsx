import { useMemo, useRef, useState } from "react";
import { Download, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { FileDrop } from "./components/FileDrop";
import { MetricsPanel } from "./components/MetricsPanel";
import { PitchView } from "./components/PitchView";
import { computeFrameMetrics } from "./lib/metrics";
import { exportFramePdf } from "./lib/pdf";
import { findInitialFrame, indexFrames, parseMetadataFile, parseTrackingFile } from "./lib/parsers";
import type { MatchMetadata, TrackingFrame } from "./types";

export default function App() {
  const [metadata, setMetadata] = useState<MatchMetadata | null>(null);
  const [frames, setFrames] = useState<TrackingFrame[]>([]);
  const [frameNumber, setFrameNumber] = useState(0);
  const [metadataName, setMetadataName] = useState<string>();
  const [trackingName, setTrackingName] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playbackRef = useRef<number | undefined>(undefined);

  const frameMap = useMemo(() => indexFrames(frames), [frames]);
  const frame = frameMap.get(frameNumber);
  const previousFrame = frameMap.get(frameNumber - 1);
  const firstFrame = frames[0]?.frame ?? metadata?.match_periods[0]?.start_frame ?? 0;
  const lastFrame = frames.at(-1)?.frame ?? metadata?.match_periods.at(-1)?.end_frame ?? 0;
  const metrics = useMemo(() => computeFrameMetrics(frame, previousFrame, metadata), [frame, previousFrame, metadata]);

  async function loadMetadata(file: File) {
    const parsed = await parseMetadataFile(file);
    setMetadata(parsed);
    setMetadataName(file.name);
    setFrameNumber(parsed.match_periods[0]?.start_frame ?? 0);
  }

  async function loadTracking(file: File) {
    const parsed = await parseTrackingFile(file);
    setFrames(parsed);
    setTrackingName(file.name);
    setFrameNumber(findInitialFrame(parsed));
  }

  function setNearestFrame(nextFrame: number) {
    const clamped = Math.max(firstFrame, Math.min(lastFrame, Math.round(nextFrame)));
    if (frameMap.has(clamped)) {
      setFrameNumber(clamped);
      return;
    }

    const nearest = frames.reduce((selected, item) => {
      return Math.abs(item.frame - clamped) < Math.abs(selected.frame - clamped) ? item : selected;
    }, frames[0]);
    setFrameNumber(nearest?.frame ?? clamped);
  }

  function togglePlayback() {
    if (isPlaying) {
      window.clearInterval(playbackRef.current);
      setIsPlaying(false);
      return;
    }

    playbackRef.current = window.setInterval(() => {
      setFrameNumber((current) => {
        const next = current + 1;
        return next > lastFrame ? firstFrame : next;
      });
    }, 100);
    setIsPlaying(true);
  }

  const canExport = Boolean(metadata && frame);

  return (
    <main className="appShell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Browser-only match report generator</p>
          <h1>Frame to PDF</h1>
        </div>
        <button
          className="primaryButton"
          type="button"
          disabled={!canExport}
          onClick={() => {
            if (metadata && frame) {
              exportFramePdf(canvasRef.current, metadata, frame, metrics);
            }
          }}
          title="Export the selected frame report as a PDF"
        >
          <Download size={18} />
          Export PDF
        </button>
      </header>

      <section className="workspace">
        <aside className="sidePanel">
          <div className="panel">
            <div className="panelHeader">
              <h2>Inputs</h2>
            </div>
            <FileDrop label="Match metadata" accept=".json,application/json" fileName={metadataName} onFile={loadMetadata} />
            <FileDrop label="Tracking data" accept=".jsonl,.json,text/plain,application/json" fileName={trackingName} onFile={loadTracking} />
          </div>

          <div className="panel matchPanel">
            <div className="panelHeader">
              <h2>Match</h2>
            </div>
            <div className="scoreline">
              <strong>{metadata?.home_team.acronym ?? "HOME"}</strong>
              <span>
                {metadata ? `${metadata.home_team_score}-${metadata.away_team_score}` : "-"}
              </span>
              <strong>{metadata?.away_team.acronym ?? "AWAY"}</strong>
            </div>
            <dl>
              <dt>Competition</dt>
              <dd>{metadata?.competition_edition?.competition?.name ?? metadata?.competition_edition?.name ?? "N/A"}</dd>
              <dt>Round</dt>
              <dd>{metadata?.competition_round?.name ?? "N/A"}</dd>
              <dt>Venue</dt>
              <dd>{metadata?.stadium?.name ?? "N/A"}</dd>
              <dt>Selected frame</dt>
              <dd>{frameNumber}</dd>
              <dt>Timestamp</dt>
              <dd>{frame?.timestamp ?? "N/A"}</dd>
            </dl>
          </div>
        </aside>

        <section className="mainPanel">
          <div className="pitchHeader">
            <div>
              <h2>Pitch Snapshot</h2>
              <p>{frame?.player_data.length ? `${frame.player_data.length} players visible` : "No populated frame selected"}</p>
            </div>
            <div className="legend">
              <span><i className="homeDot" /> {metadata?.home_team.acronym ?? "Home"}</span>
              <span><i className="awayDot" /> {metadata?.away_team.acronym ?? "Away"}</span>
              <span><i className="ballDot" /> Ball</span>
            </div>
          </div>

          <PitchView canvasRef={canvasRef} metadata={metadata} frame={frame} metrics={metrics} />

          <div className="timeline">
            <button type="button" onClick={() => setNearestFrame(frameNumber - 1)} title="Previous frame">
              <SkipBack size={18} />
            </button>
            <button type="button" onClick={togglePlayback} disabled={frames.length === 0} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <input
              type="range"
              min={firstFrame}
              max={lastFrame}
              value={frameNumber}
              disabled={frames.length === 0}
              onChange={(event) => setNearestFrame(Number(event.target.value))}
            />
            <button type="button" onClick={() => setNearestFrame(frameNumber + 1)} title="Next frame">
              <SkipForward size={18} />
            </button>
            <input
              className="frameInput"
              type="number"
              value={frameNumber}
              min={firstFrame}
              max={lastFrame}
              onChange={(event) => setNearestFrame(Number(event.target.value))}
            />
          </div>
        </section>
      </section>

      <MetricsPanel metadata={metadata} metrics={metrics} />
    </main>
  );
}
