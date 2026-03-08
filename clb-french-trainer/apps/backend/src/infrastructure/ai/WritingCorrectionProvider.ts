export interface WritingCorrectionProvider {
  correctEssay(input: { text: string; targetClb: 5 | 7 }): Promise<{
    correctedText: string;
    score: number;
    feedback: string[];
  }>;
}
