interface ProjectDestinationDecision {
  canonicalHref: string | null;
  candidates: Array<{
    href: string;
    observation: string;
  }>;
  recommendation: string;
}

export const HOLUS_OBSERVATORY_DESTINATION_DECISION: ProjectDestinationDecision = {
  canonicalHref: null,
  candidates: [
    {
      href: 'https://holus-observatory.vercel.app',
      observation: 'Deployment named for Holus Observatory',
    },
    {
      href: 'https://frontend-six-rho-96.vercel.app',
      observation: 'Observed Genpeli/front-end deployment',
    },
  ],
  recommendation:
    'Camilo should verify which deployment serves Holus Observatory rather than Genpeli, then set canonicalHref only after confirming the product identity.',
};
