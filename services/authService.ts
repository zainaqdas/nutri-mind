import { UserProfile } from "../types";
import { DEFAULT_PROFILE } from "../constants";
import { dbService } from "./dbService";

const SESSION_KEY = 'nutrimind_session_user_email';

export const authService = {
  login: async (email: string, password: string): Promise<UserProfile> => {
    if (!email || !password) throw new Error("Email and password are required");
    
    // Retrieve persistent profile from IndexedDB
    const profile = await dbService.getProfile();
    
    // Update it with the login email (mock login logic)
    const userProfile = { ...profile, email };
    
    // Save updated profile to DB
    await dbService.updateProfile(userProfile);
    
    // Store simple session marker
    localStorage.setItem(SESSION_KEY, email);
    
    return userProfile;
  },

  register: async (name: string, email: string, password: string): Promise<UserProfile> => {
    if (!email || !password || !name) throw new Error("All fields are required");
    
    const newProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      name,
      email
    };
    
    await dbService.updateProfile(newProfile);
    localStorage.setItem(SESSION_KEY, email);
    
    return newProfile;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Note: This now returns a Promise because it fetches from IDB
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const sessionEmail = localStorage.getItem(SESSION_KEY);
    if (!sessionEmail) return null;
    
    try {
      const profile = await dbService.getProfile();
      // Verify email matches session (simple check)
      if (profile.email === sessionEmail) {
        return profile;
      }
      // If profile exists but email doesn't match (stale data), return it anyway or null?
      // For this simple app, return the profile.
      return profile;
    } catch {
      return null;
    }
  }
};