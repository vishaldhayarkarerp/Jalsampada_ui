"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  apiKey: string | null;
  apiSecret: string | null;
  posProfile: string | null;
  currentUser: string | null;
  setPosProfile: (profile: string) => void;
  login: (apiKey: string, apiSecret: string) => void;
  logout: () => void;
  checkOpenPOS: (posProfile: string, user: string) => Promise<boolean>;
  checkAnyOpenPOS: (posProfile: string) => Promise<{ isOpen: boolean; entryName?: string; userName?: string } | null>;
  getCurrentUser: () => Promise<string | null>;
  isInitialized: boolean;
  csrfToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiSecret, setApiSecret] = useState<string | null>(null);
  const [posProfile, setPosProfile] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for existing authentication data
    const storedApiKey = localStorage.getItem("apiKey");
    const storedApiSecret = localStorage.getItem("apiSecret");
    const storedPosProfile = localStorage.getItem("posProfile");
    const storedUser = localStorage.getItem("currentUser");

    if (storedApiKey && storedApiSecret) {
      setApiKey(storedApiKey);
      setApiSecret(storedApiSecret);
      setIsAuthenticated(true);
    }
    if (storedPosProfile) {
      setPosProfile(storedPosProfile);
    }
    if (storedUser) {
      setCurrentUser(storedUser);
    }

    const storedCsrfToken = localStorage.getItem('csrfToken');
    if (storedCsrfToken) {
      setCsrfToken(storedCsrfToken);
    }

    setIsInitialized(true);

    // Fetch current user if authenticated
    if (storedApiKey && storedApiSecret && !storedUser) {
      getCurrentUser().then((user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem("currentUser", user);
        }
      });
    }
  }, []);

  const login = (apiKey: string, apiSecret: string) => {
    setApiKey(apiKey);
    setApiSecret(apiSecret);
    setIsAuthenticated(true);
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("apiSecret", apiSecret);
    // Fetch current user after login
    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.setItem("currentUser", user);
      }
    });
  };

  const logout = () => {
    setApiKey(null);
    setApiSecret(null);
    setPosProfile(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("apiKey");
    localStorage.removeItem("apiSecret");
    localStorage.removeItem("posProfile");
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  const getCurrentUser = async (): Promise<string | null> => {
    try {
      const response = await fetch(
        "http://103.219.1.138:4430/api/method/frappe.auth.get_logged_user",
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            Authorization: `token ${apiKey}:${apiSecret}`, // Use API key for consistency
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message || null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  };

  const checkOpenPOS = async (posProfile: string, user: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `http://103.219.1.138:4430/api/resource/POS Opening Entry?filters=[["pos_profile","=","${posProfile}"],["status","=","Open"],["user","=","${user}"]]`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
        }
      );

      const responseData = await response.json();
      if (response.ok && responseData.data && responseData.data.length > 0) {
        return true; // Open POS Opening Entry exists for this user and profile
      }
      return false; // No open POS Opening Entry
    } catch (error) {
      console.error("Error checking POS Opening Entry:", error);
      return false; // Treat errors as no open entry
    }
  };

  const checkAnyOpenPOS = async (posProfile: string): Promise<{ isOpen: boolean; entryName?: string; userName?: string } | null> => {
    try {
      const response = await fetch(
        `http://103.219.1.138:4430/api/resource/POS Opening Entry?filters=[["pos_profile","=","${posProfile}"],["status","=","Open"]]&fields=["name","user"]`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
        }
      );

      const responseData = await response.json();
      console.log("checkAnyOpenPOS API response:", responseData); // Debug log
      if (response.ok && responseData.data && responseData.data.length > 0) {
        const openEntry = responseData.data[0];
        console.log("Found open POS entry:", openEntry); // Debug log
        return {
          isOpen: true,
          entryName: openEntry.name,
          userName: openEntry.user,
        };
      }
      console.log("No open POS entries found"); // Debug log
      return { isOpen: false }; // No open POS Opening Entry
    } catch (error) {
      console.error("Error checking any open POS Opening Entry:", error);
      return null; // Treat errors as null
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        apiKey,
        apiSecret,
        posProfile,
        currentUser,
        setPosProfile: (profile: string) => {
          setPosProfile(profile);
          localStorage.setItem("posProfile", profile);
        },
        login,
        logout,
        checkOpenPOS,
        checkAnyOpenPOS,
        getCurrentUser,
        isInitialized,
        csrfToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};