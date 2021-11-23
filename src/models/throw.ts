export enum DartboardScoreType {
  Single = 'single',
  Double = 'double',
  Triple = 'triple',
  Bull = 'bull',
  Out = 'out',
}

export interface Throw {
  type: DartboardScoreType;
  score: number;
}
