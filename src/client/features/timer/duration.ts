/**
 * The one value object this codebase needs: `SET_*` actions receive minutes
 * from the UI, but `PomodoroCycle` stores durations in seconds. Wrapping the
 * conversion here (instead of a bare `* 60` in the reducer) makes the unit
 * conversion a single named place instead of an implicit convention.
 */
export class Duration {
  private constructor(readonly seconds: number) {}

  static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 60)
  }
}
