import type { MatchMetadata, TrackingFrame } from "../types";

export async function parseMetadataFile(file: File): Promise<MatchMetadata> {
  const text = await file.text();
  return JSON.parse(text) as MatchMetadata;
}

export async function parseTrackingFile(file: File): Promise<TrackingFrame[]> {
  const text = await file.text();
  return parseTrackingText(text);
}

export function parseTrackingText(text: string): TrackingFrame[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as TrackingFrame);
}

export function indexFrames(frames: TrackingFrame[]): Map<number, TrackingFrame> {
  return new Map(frames.map((frame) => [frame.frame, frame]));
}

export function findInitialFrame(frames: TrackingFrame[]): number {
  return frames.find((frame) => frame.player_data.length > 0)?.frame ?? frames[0]?.frame ?? 0;
}
