export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  pomodoroStats: UserPomodoroStats
};

export type UserWithoutPassword = Omit<User, 'password'>;

export type UserLogin = {
  email: string;
  password: string;
};

export type UserPomodoroStats = {
  completedSessions: number;
  abortedSessions: number;
  totalSessions: number;
  totalFocusDuration: number;
  totalShortBreakDuration: number;
  totalLongBreakDuration: number;
}