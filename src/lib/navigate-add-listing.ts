import { isAdminRole, isPartnerRole } from '@/lib/auth-roles';
import type { AccountType, AppPage, User } from '@/types';

type AddListingNav = {
  currentUser: User | null;
  setCurrentPage: (page: AppPage) => void;
  setAdminTab: (tab: string) => void;
  setRegisterAccountTypePreset: (type: AccountType | null) => void;
};

/** Route "add your listing" CTA to the right destination for the current user. */
export function navigateToAddListing({
  currentUser,
  setCurrentPage,
  setAdminTab,
  setRegisterAccountTypePreset,
}: AddListingNav) {
  if (currentUser && isAdminRole(currentUser.role)) {
    setAdminTab('properties');
    setCurrentPage('admin');
    return;
  }
  if (currentUser && isPartnerRole(currentUser.role)) {
    setCurrentPage('partner-dashboard');
    return;
  }
  setRegisterAccountTypePreset('OWNER');
  setCurrentPage('register');
}
