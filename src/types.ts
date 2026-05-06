export type Team = {
  id: number;
  name: string;
  short_name?: string;
  acronym?: string;
};

export type Kit = {
  jersey_color?: string;
  number_color?: string;
};

export type MatchPeriod = {
  period: number;
  name: string;
  start_frame: number;
  end_frame: number;
  duration_frames: number;
  duration_minutes: number;
};

export type Player = {
  id: number;
  team_id: number;
  number: number;
  short_name: string;
  first_name?: string;
  last_name?: string;
  trackable_object?: number;
  player_role?: {
    name: string;
    acronym: string;
    position_group: string;
  };
};

export type MatchMetadata = {
  id: number;
  home_team_score: number;
  away_team_score: number;
  date_time: string;
  stadium?: {
    name: string;
    city?: string;
  };
  home_team: Team;
  away_team: Team;
  home_team_kit?: Kit;
  away_team_kit?: Kit;
  competition_edition?: {
    name: string;
    competition?: {
      name: string;
    };
  };
  competition_round?: {
    name: string;
  };
  match_periods: MatchPeriod[];
  players: Player[];
  pitch_length: number;
  pitch_width: number;
};

export type BallData = {
  x: number | null;
  y: number | null;
  z: number | null;
  is_detected: boolean | null;
};

export type PlayerFrameData = {
  x: number;
  y: number;
  player_id: number;
  is_detected: boolean | null;
};

export type TrackingFrame = {
  frame: number;
  timestamp: string | null;
  period: number | null;
  ball_data: BallData;
  possession: {
    player_id: number | null;
    group: string | null;
  };
  player_data: PlayerFrameData[];
};

export type PlayerMetric = PlayerFrameData & {
  player?: Player;
  team?: Team;
  distanceToBall?: number;
  speed?: number;
};

export type FrameMetrics = {
  closestToBall?: PlayerMetric;
  fastest?: PlayerMetric;
  ballSpeed?: number;
  homeShape?: TeamShape;
  awayShape?: TeamShape;
  players: PlayerMetric[];
};

export type TeamShape = {
  width: number;
  depth: number;
  centroidX: number;
  centroidY: number;
};
