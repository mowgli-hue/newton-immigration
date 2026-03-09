export type CRSInput = {
  age: number;
  education: number;
  language: number;
  foreignWork: number;
  canadianWork: number;
  spouse: number;
  additional: number;
};

export const calculateCRS = (input: CRSInput): number => {
  const agePoints = Math.max(0, Math.min(input.age, 45)) * 2;
  const educationPoints = input.education;
  const languagePoints = input.language;
  const foreignWorkPoints = input.foreignWork;
  const canadianWorkPoints = input.canadianWork;
  const spousePoints = input.spouse;
  const additionalPoints = input.additional;

  return agePoints + educationPoints + languagePoints + foreignWorkPoints + canadianWorkPoints + spousePoints + additionalPoints;
};
