// ─────────────────────────────────────────────────────────────────────────────
// useFactory — resolves the CURRENTLY ACTIVE factory from the session.
//
// Returns the factory the user has selected in the nav switcher.
// For single-factory users this is always their home factory.
// For parent users this changes when they switch sub-factories.
//
// Usage in any component:
//   const factory = useFactory();
//   factory.nameEn   → 'MG FASHION LIMITED'  (if switched to fashion)
//   factory.nameBn   → 'এমজি ফ্যাশন লিমিটেড'
//   factory.addressEn / addressBn / authorities / committees
//
// Security: unknown ids fall back to PRIMARY_FACTORY — never leaks data.
// ─────────────────────────────────────────────────────────────────────────────

import { useAuth } from '../context/AuthContext';
import {
  getFactoryById,
  getAccessibleFactories,
  PRIMARY_FACTORY,
  type FactoryConfig,
} from '../factories/FactoryRegistry';
import { getRegulatoryBundle, type RegulatoryBundle } from '../regulatory/regulatoryBundles';

/** Returns the currently active factory (respects the nav switcher) */
export function useFactory(): FactoryConfig {
  const { activeFactoryId } = useAuth();
  if (!activeFactoryId) return PRIMARY_FACTORY;
  return getFactoryById(activeFactoryId);
}

/**
 * Resolves the currently active factory's regulatory bundle (RMG/EPZ) —
 * defaults to RMG if the factory's config doesn't set one, matching every
 * existing factory's actual sector (see regulatoryBundles.ts for what
 * this controls and which EPZ figures are still unverified).
 */
export function useRegulatoryBundle(): RegulatoryBundle {
  const factory = useFactory();
  return getRegulatoryBundle(factory.regulatoryBundle ?? 'RMG');
}

/** Returns all factories the logged-in user can switch between */
export function useAccessibleFactories(): FactoryConfig[] {
  const { user } = useAuth();
  if (!user?.factoryId) return [PRIMARY_FACTORY];
  return getAccessibleFactories(user.factoryId);
}

/** Returns signature-block authorities for the currently active factory */
export function useFactoryAuthorities() {
  const factory = useFactory();
  const a = factory.authorities;
  return {
    authorized1: { name: a.hrManager.nameEn,       designation: a.hrManager.designationEn },
    authorized2: { name: a.factoryHead.nameEn,      designation: a.factoryHead.designationEn },
    approved1:   { name: a.hoHrHead.nameEn,         designation: a.hoHrHead.designationEn },
    approved2:   { name: a.headOfOperations.nameEn, designation: a.headOfOperations.designationEn },
  };
}
