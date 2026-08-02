export const RECRUITER_FACTS = {
  targetRoles: 'Applied AI Engineer roles',
  location: 'NYC',
  workModes: 'remote/hybrid teams',
  email: 'juancamilomabe@gmail.com',
} as const;

export const CHAT_UNAVAILABLE_RECRUITER_FALLBACK =
  `AI service is temporarily unavailable, but here is the direct answer: Camilo is open to ${RECRUITER_FACTS.targetRoles} in ${RECRUITER_FACTS.location}, including ${RECRUITER_FACTS.workModes}. Reach him at [${RECRUITER_FACTS.email}](mailto:${RECRUITER_FACTS.email}).`;
