import { data } from './state-borders-publicamundi-raw';

export const stateBorders = data.features
  .filter(state => state.geometry.type === 'Polygon')
  .filter(state => state.properties.name !== 'District of Columbia')
  .filter(state => state.properties.name !== 'Puerto Rico');
