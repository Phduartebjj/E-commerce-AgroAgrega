import { getPartnerStoreLogo } from './partner-stores';

// Verifica a escolha da logo da loja parceira ou da imagem padrão.
describe('getPartnerStoreLogo', () => {
  it.each([
    ['AgroSense', 'agrosense.png'],
    ['Biomatrix', 'biomatrix.png'],
    ['MultiGrão', 'multigrao.png'],
    ['SafraMax', 'saframax.png'],
  ])('should return the partner image for %s', (brand, fileName) => {
    expect(getPartnerStoreLogo(brand)).toBe(`/assets/images/partner-stores/${fileName}`);
  });

  it('should use the AgroAgrega image when a product has no partner brand', () => {
    expect(getPartnerStoreLogo('none')).toBe('/assets/images/agroagrega-icon.webp');
    expect(getPartnerStoreLogo(undefined)).toBe('/assets/images/agroagrega-icon.webp');
  });
});
