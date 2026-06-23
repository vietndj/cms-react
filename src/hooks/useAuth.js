import { useState, useEffect } from "react";
import { SECRET_PIN } from "../constants/config";
import { fetchTokenFromCloud } from "../services/supabase";
import { decryptToken } from "../services/crypto";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (localStorage.getItem("cms_auth") === "granted") {
      setIsAuthenticated(true);
    }
    const t = localStorage.getItem("github_pat");
    if (t) setToken(t);
  }, []);

  const handleLogin = async () => {
    if (pin.trim() !== SECRET_PIN) {
      alert("Mã PIN sai.");
      return;
    }
    localStorage.setItem("cms_auth", "granted");
    setIsAuthenticated(true);

    try {
      const encData = await fetchTokenFromCloud();
      if (encData) {
        const pat = await decryptToken(encData, pin.trim());
        if (pat) {
          setToken(pat);
          localStorage.setItem("github_pat", pat);
          try {
            localStorage.setItem("_enc_token_cache", JSON.stringify(encData));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Lỗi tải token cloud:", e);
    }
  };

  const logout = () => {
    localStorage.removeItem("cms_auth");
    setIsAuthenticated(false);
    setPin("");
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    pin,
    setPin,
    token,
    setToken,
    handleLogin,
    logout,
  };
}
