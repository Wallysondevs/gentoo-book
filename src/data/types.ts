export type Difficulty = "iniciante" | "intermediario" | "avancado";
export type AlertType = "info" | "warning" | "danger" | "success" | "tip";

export interface CodeSample {
  lang: string;
  code: string;
}

export interface AlertSpec {
  type: AlertType;
  content: string;
}

export interface Chapter {
  slug: string;
  section: string;
  title: string;
  difficulty: Difficulty;
  subtitle: string;
  intro: string;
  codes: CodeSample[];
  points: string[];
  alerts: AlertSpec[];
}

export interface Section {
  id: string;
  icon: string;
  label: string;
  chapterSlugs: string[];
}
