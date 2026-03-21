import { Role } from "@/lib/models";

export type NewtonTeamMember = {
  name: string;
  email: string;
  role: Role;
  workspaceDriveLink: string;
  workspaceDriveFolderId?: string;
};

function extractDriveFolderId(link: string): string | undefined {
  const value = String(link || "").trim();
  if (!value) return undefined;
  const byFolders = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (byFolders?.[1]) return byFolders[1];
  const byId = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return byId?.[1];
}

export const NEWTON_TEAM_MEMBERS: NewtonTeamMember[] = [
  {
    name: "Lavisha Dhingra",
    email: "lavisha.newtonimmigration@gmail.com",
    role: "Admin",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1L2JQGZ3NltEcNLHHPG1EBOn4UL53b5Dt?usp=sharing"
  },
  {
    name: "Manpreet Kaur",
    email: "manpreetnewtonimmigration8@gmail.com",
    role: "Marketing",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1--s9OI99gDdxC3wMKaVUApUsryR8fNf0?usp=sharing"
  },
  {
    name: "neha Brar",
    email: "neha.newtonimmigration@gmail.com",
    role: "Admin",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1NUAxlCwQsWUmd7er5ZIXMAuwpi0GOtk7?usp=drive_link"
  },
  {
    name: "Rajwinder Kaur",
    email: "rajwinder.newtonimmigration@gmail.com",
    role: "Processing",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1AvQMdYzrtRxpuYArL2L3frzC92xKZA2T?usp=drive_link"
  },
  {
    name: "Ramandeep kaur",
    email: "ramandeep.newtonimmigration@gmail.com",
    role: "ProcessingLead",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1BMRFrdryk1unt8EU2a_c-kW6Q4_eA6lf?usp=drive_link"
  },
  {
    name: "Avneet kaur",
    email: "avneet.newtonimmigration@gmail.com",
    role: "Processing",
    workspaceDriveLink: "https://drive.google.com/drive/folders/12aJ7rYQUsMfzIbHovS2amIiBkP029j6f?usp=sharing"
  },
  {
    name: "Simi das",
    email: "simi.newtonimmigration@gmail.com",
    role: "Processing",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1_9dx5FmI7AlzUYofQhvOnyAFYROZr_ud?usp=drive_link"
  },
  {
    name: "Rapneet kaur",
    email: "rapneet.newtonimmigration@gmail.com",
    role: "Processing",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1AIOz45EdbMsG4rZlBF-HWQkrnWFrs5GZ?usp=drive_link"
  },
  {
    name: "Serbleen Kour",
    email: "serbleen.newtonimmigration@gmail.com",
    role: "Admin",
    workspaceDriveLink: "https://drive.google.com/drive/folders/19zWZyTBlPj3q0VHtjTVTqWNZw5Qm3XvG?usp=drive_link"
  },
  {
    name: "sukhman Kaur",
    email: "sukhman.newtonimmigration@gmail.com",
    role: "Admin",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1Cp0_YYPZah637TPXdCskQhec-jEAcovF?usp=drive_link"
  },
  {
    name: "guest member",
    email: "team.newtonimmigration@gmail.com",
    role: "Processing",
    workspaceDriveLink: "https://drive.google.com/drive/folders/1FAjuG-Uj4fhp9zWfVsiHoX8WbVPT_r7j?usp=sharing"
  }
].map((item) => ({
  ...item,
  workspaceDriveFolderId: extractDriveFolderId(item.workspaceDriveLink)
}));

