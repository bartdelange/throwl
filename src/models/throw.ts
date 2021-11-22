export type DartboardScoreType =
  | 'single'
  | 'double'
  | 'triple'
  | 'bull'
  | 'out';

export interface Throw {
  type: DartboardScoreType;
  score: number;
}
