import { projects, type ProjectMeta } from '@/data/projects'

export const featuredProjects = projects.filter((p) => p.tier === 1)
export const supportingProjects = projects.filter((p) => p.tier === 2)
export const personalProjects = projects.filter((p) => p.tier === 3)

export const EMAIL = 'juancamilomabe@gmail.com'
export const MAILTO = `mailto:${EMAIL}?subject=AI%20Engineer%20Opportunity`
export const LINKEDIN = 'https://www.linkedin.com/in/camilomartinez-ai/'
export const GITHUB = 'https://github.com/camilojourney'

export function appLabel(p: ProjectMeta): string {
  return p.appLabel || (p.isExternalApp ? 'Launch live app' : 'View live app')
}

export const statusLabel: Record<ProjectMeta['status'], string> = {
  live: 'Live',
  'in-progress': 'In progress',
  prototype: 'Prototype',
  concept: 'Concept',
}
