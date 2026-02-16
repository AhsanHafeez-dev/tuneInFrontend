"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "../login/page.module.css"; // Reusing login styles
import apiClient from '@/utils/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    userName: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // 1. Get Signature
      const sigRes = await apiClient('/api/v1/users/signature'); // Public endpoint
      if (!sigRes.ok) throw new Error('Failed to get upload signature');
      const { signature, timestamp, api_key, cloud_name } = (await sigRes.json()).data;

      const uploadToCloudinary = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('resource_type', 'image');

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Cloudinary upload failed');
        return await response.json();
      };

      // 2. Upload Avatar (and Cover if we added it to CLI, but only avatar is here now)
      const uploadedAvatar = await uploadToCloudinary(avatar);
      if (!uploadedAvatar) throw new Error("Avatar upload failed");

      // 3. Register
      const registerData = {
        ...formData,
        avatarUrl: uploadedAvatar.secure_url,
        avatarPublicId: uploadedAvatar.public_id
      };

      const res = await apiClient("/api/v1/users/register", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const result = await res.json();
      if (res.ok) {
        router.push("/login");
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent flash of content if logged in
  if (authLoading || user) {
    return <div className="loading"></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Join AHtube</h1>
        <p>Create an account to start sharing</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={formData.userName}
            onChange={(e) =>
              setFormData({ ...formData, userName: e.target.value })
            }
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <div style={{ textAlign: "left" }}>
            <label
              style={{
                fontSize: "0.9rem",
                color: "var(--muted-foreground)",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Avatar
            </label>
            <input
              type="file"
              onChange={(e) => setAvatar(e.target.files[0])}
              accept="image/*"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
