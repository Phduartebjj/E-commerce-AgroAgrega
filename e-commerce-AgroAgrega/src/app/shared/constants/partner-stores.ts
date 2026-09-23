const PARTNER_STORE_LOGOS: Readonly<Record<string, string>> = {
  AgroSense: '/assets/images/partner-stores/agrosense.png',
  Biomatrix: '/assets/images/partner-stores/biomatrix.png',
  MultiGrão: '/assets/images/partner-stores/multigrao.png',
  SafraMax: '/assets/images/partner-stores/saframax.png',
};

const AGROAGREGA_LOGO = '/assets/images/agroagrega-icon.webp';

export function getPartnerStoreLogo(brand?: string | null): string {
  if (!brand || brand === 'none' || brand === 'AgroAgrega' || brand === 'Seleção AgroAgrega') {
    return AGROAGREGA_LOGO;
  }

  return PARTNER_STORE_LOGOS[brand] ?? AGROAGREGA_LOGO;
}
