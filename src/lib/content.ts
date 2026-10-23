import site from '../../content/site.json';

export interface Site {
  name: string;
  tagline: string;
  intro: string;
  email: string;
  phone: string;
  address: string;
  hours: string[];
}

export function getSite(): Site {
  return site as Site;
}
