export interface CaseSummary {
  id: string;
  title: string;
  vignette: string;
  createdAt: string;
}

export interface CaseDetail {
  id: string;
  title: string;
  vignette: string;
  differentialChoices: string[];
  testChoices: string[];
}

export interface CaseFeedback {
  differential: {
    matchedPrimary: string[];
    matchedReasonable: string[];
    missedPrimary: string[];
    extras: string[];
  };
  tests: {
    appropriate: string[];
    unnecessary: string[];
    missedIndicated: string[];
  };
  differentialScore: number;
  testScore: number;
}

export interface CaseAttemptResult {
  id: string;
  score: number;
  feedback: CaseFeedback;
}
