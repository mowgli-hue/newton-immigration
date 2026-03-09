const guidanceLibrary: Record<string, string> = {
  pr460:
    "A CRS around 460 can still be competitive in targeted draws, especially with category alignment. Focus on language gains and provincial options.",
  alberta:
    "Alberta PNP can be possible when your occupation and profile match active provincial priorities. A targeted NOI strategy improves your odds.",
  cec:
    "CEC eligibility depends on qualifying Canadian work experience, language level, and admissibility. Keep your work records and status history clean."
};

export const generateAdvisorResponse = (question: string, count: number) => {
  const q = question.toLowerCase();

  let guidance =
    "Your profile may fit multiple pathways. A structured assessment can identify CRS levers, province targeting, and timeline strategy.";

  if (q.includes("460") || q.includes("crs")) {
    guidance = guidanceLibrary.pr460;
  } else if (q.includes("alberta")) {
    guidance = guidanceLibrary.alberta;
  } else if (q.includes("cec")) {
    guidance = guidanceLibrary.cec;
  }

  const showConsultationCta = count >= 3;

  return { guidance, showConsultationCta };
};
